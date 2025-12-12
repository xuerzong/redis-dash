use serde_json::{json, Value as JsonValue};

pub fn parse_redis_value(v: redis::Value) -> JsonValue {
  match v {
    redis::Value::Nil => JsonValue::Null,
    redis::Value::Int(i) => json!(i),
    redis::Value::BulkString(bytes) => json!(String::from_utf8_lossy(&bytes)),
    redis::Value::Array(list) => {
      let json_list: Vec<JsonValue> = list.into_iter().map(parse_redis_value).collect();
      JsonValue::Array(json_list)
    }
    redis::Value::SimpleString(s) => json!(s),
    other => json!(format!("{:?}", other)),
  }
}
