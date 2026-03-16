use nanoid::nanoid;
use serde_json::{json, Map, Value as JsonValue};
use std::{
    io,
    path::{Path, PathBuf},
};
use tokio::fs;

pub async fn list_json_records(records_dir: &Path) -> Result<Vec<(String, JsonValue)>, String> {
    fs::create_dir_all(records_dir)
        .await
        .map_err(|error| error.to_string())?;

    let mut entries = fs::read_dir(records_dir)
        .await
        .map_err(|error| error.to_string())?;
    let mut records = Vec::new();

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|error| error.to_string())?
    {
        let path = entry.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }

        let Some(id) = path.file_stem().and_then(|value| value.to_str()) else {
            continue;
        };

        if let Some(record) = find_json_record(records_dir, id).await? {
            records.push((id.to_string(), record));
        }
    }

    Ok(records)
}

pub async fn find_json_record(records_dir: &Path, id: &str) -> Result<Option<JsonValue>, String> {
    let path = record_file_path(records_dir, id)?;
    let content = match fs::read_to_string(&path).await {
        Ok(content) => content,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    serde_json::from_str(&content)
        .map(Some)
        .map_err(|error| error.to_string())
}

pub async fn create_json_record(records_dir: &Path, payload: JsonValue) -> Result<String, String> {
    fs::create_dir_all(records_dir)
        .await
        .map_err(|error| error.to_string())?;

    let id = payload
        .get("id")
        .and_then(JsonValue::as_str)
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| nanoid!(8));

    let mut object = payload
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;
    object.remove("id");

    fs::write(
        record_file_path(records_dir, &id)?,
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())?;

    Ok(id)
}

pub async fn update_json_record(
    records_dir: &Path,
    id: &str,
    payload: JsonValue,
) -> Result<(), String> {
    let path = record_file_path(records_dir, id)?;
    let current = match fs::read_to_string(&path).await {
        Ok(content) => serde_json::from_str::<JsonValue>(&content).unwrap_or_else(|_| json!({})),
        Err(error) if error.kind() == io::ErrorKind::NotFound => json!({}),
        Err(error) => return Err(error.to_string()),
    };

    let object = merge_json_objects(current, payload)?
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;

    fs::write(
        path,
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())
}

pub async fn delete_json_record(records_dir: &Path, id: &str) -> Result<(), String> {
    let path = record_file_path(records_dir, id)?;
    match fs::remove_file(path).await {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

pub async fn get_json_config(config_path: &Path) -> Result<JsonValue, String> {
    match fs::read_to_string(config_path).await {
        Ok(content) => serde_json::from_str(&content).map_err(|error| error.to_string()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(JsonValue::Null),
        Err(error) => Err(error.to_string()),
    }
}

pub async fn set_json_config(config_path: &Path, payload: JsonValue) -> Result<(), String> {
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| error.to_string())?;
    }

    fs::write(
        config_path,
        serde_json::to_vec_pretty(&payload).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())
}

fn record_file_path(records_dir: &Path, id: &str) -> Result<PathBuf, String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("invalid record id".to_string());
    }

    Ok(records_dir.join(format!("{id}.json")))
}

fn merge_json_objects(current: JsonValue, next: JsonValue) -> Result<JsonValue, String> {
    let mut current_object = current.as_object().cloned().unwrap_or_else(Map::new);
    let next_object = next
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;

    for (key, value) in next_object {
        if key == "id" {
            continue;
        }
        current_object.insert(key, value);
    }

    Ok(JsonValue::Object(current_object))
}