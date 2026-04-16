use std::collections::BTreeSet;

use fontdb::Database;
use serde_json::Value as JsonValue;

pub fn list_mono_fonts() -> Result<JsonValue, String> {
  let mut db = Database::new();
  db.load_system_fonts();

  let mut families = BTreeSet::new();
  for face in db.faces() {
    if !face.monospaced {
      continue;
    }

    for (family_name, _) in &face.families {
      families.insert(family_name.clone());
    }
  }

  Ok(JsonValue::Array(
    families.into_iter().map(JsonValue::String).collect(),
  ))
}
