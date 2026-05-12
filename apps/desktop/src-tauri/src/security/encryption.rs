use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use hkdf::Hkdf;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedSecretDto {
    pub version: i32,
    pub algorithm: String,
    pub ciphertext: String,
    pub iv: String,
    pub tag: String,
}

fn derive_key(master_key: &[u8], user_id: &str, connection_id: &str) -> Result<[u8; 32], String> {
    let info = format!("{user_id}:{connection_id}");
    let hk = Hkdf::<Sha256>::new(None, master_key);
    let mut output = [0_u8; 32];
    hk.expand(info.as_bytes(), &mut output)
        .map_err(|_| String::from("failed to derive encryption key"))?;
    Ok(output)
}

pub fn encrypt_secret(master_key: &[u8], user_id: &str, connection_id: &str, value: &str) -> Result<EncryptedSecretDto, String> {
    let key = derive_key(master_key, user_id, connection_id)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|err| err.to_string())?;

    let mut iv = [0_u8; 12];
    rand::thread_rng().fill_bytes(&mut iv);
    let nonce = Nonce::from_slice(&iv);

    let encrypted = cipher
        .encrypt(nonce, value.as_bytes())
        .map_err(|_| String::from("encryption failure"))?;

    if encrypted.len() < 16 {
        return Err(String::from("invalid encrypted payload"));
    }

    let split_at = encrypted.len() - 16;
    let (ciphertext, tag) = encrypted.split_at(split_at);

    Ok(EncryptedSecretDto {
        version: 1,
        algorithm: String::from("AES-256-GCM"),
        ciphertext: base64::encode(ciphertext),
        iv: base64::encode(iv),
        tag: base64::encode(tag),
    })
}

pub fn decrypt_secret(
    master_key: &[u8],
    user_id: &str,
    connection_id: &str,
    ciphertext: &str,
    iv: &str,
    tag: &str,
) -> Result<String, String> {
    let key = derive_key(master_key, user_id, connection_id)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|err| err.to_string())?;

    let iv_bytes = base64::decode(iv).map_err(|err| err.to_string())?;
    if iv_bytes.len() != 12 {
        return Err(String::from("invalid iv"));
    }

    let mut payload = base64::decode(ciphertext).map_err(|err| err.to_string())?;
    payload.extend(base64::decode(tag).map_err(|err| err.to_string())?);

    let decrypted = cipher
        .decrypt(Nonce::from_slice(&iv_bytes), payload.as_ref())
        .map_err(|_| String::from("decryption failure"))?;

    String::from_utf8(decrypted).map_err(|err| err.to_string())
}
