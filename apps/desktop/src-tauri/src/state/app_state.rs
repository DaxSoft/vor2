use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub user_id: Arc<Mutex<Option<String>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            user_id: Arc::new(Mutex::new(None)),
        }
    }
}
