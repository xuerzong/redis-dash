use redis::Value;
use serde_json::{json, Value as JsonValue};

pub fn parse_redis_value(value: Value) -> JsonValue {
    match value {
        Value::Nil => JsonValue::Null,
        Value::Int(value) => json!(value),
        Value::BulkString(bytes) => json!(String::from_utf8_lossy(&bytes).to_string()),
        Value::Array(values) => {
            JsonValue::Array(values.into_iter().map(parse_redis_value).collect())
        }
        Value::SimpleString(value) => json!(value),
        Value::Okay => json!("OK"),
        Value::Map(entries) => JsonValue::Array(
            entries
                .into_iter()
                .map(|(key, value)| json!([parse_redis_value(key), parse_redis_value(value)]))
                .collect(),
        ),
        Value::Attribute { data, attributes } => json!({
          "data": parse_redis_value(*data),
          "attributes": attributes
            .into_iter()
            .map(|(key, value)| json!([parse_redis_value(key), parse_redis_value(value)]))
            .collect::<Vec<_>>()
        }),
        Value::Set(values) => JsonValue::Array(values.into_iter().map(parse_redis_value).collect()),
        Value::Double(value) => json!(value),
        Value::Boolean(value) => json!(value),
        Value::VerbatimString { text, .. } => json!(text),
        Value::BigNumber(value) => json!(value.to_string()),
        Value::Push { kind, data } => json!({
          "kind": format!("{kind:?}"),
          "data": data.into_iter().map(parse_redis_value).collect::<Vec<_>>()
        }),
        Value::ServerError(error) => json!(format!("{error:?}")),
    }
}