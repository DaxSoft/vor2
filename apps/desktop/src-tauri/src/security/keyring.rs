use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use keyring::Entry;
use rand::RngCore;

const SERVICE_NAME: &str = "r2-explorer";

pub fn get_or_create_master_key(user_id: &str) -> Result<Vec<u8>, String> {
    let key_name = format!("master-key:{user_id}");
    let entry = Entry::new(SERVICE_NAME, &key_name).map_err(|err| err.to_string())?;

    if let Ok(value) = entry.get_password() {
        return BASE64.decode(value).map_err(|err| err.to_string());
    }

    let mut bytes = vec![0_u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let encoded = BASE64.encode(&bytes);
    entry.set_password(&encoded).map_err(|err| err.to_string())?;
    Ok(bytes)
}
