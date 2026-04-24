#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TodoItem {
    pub id: u32,
    pub text: String,
    pub completed: bool,
    pub owner: Address,
}

#[contract]
pub struct TodoContract;

#[contractimpl]
impl TodoContract {
    /// Adds a new task for the caller
    pub fn add_task(env: Env, owner: Address, text: String) -> u32 {
        owner.require_auth();

        let mut tasks: Vec<TodoItem> = env.storage().instance().get(&symbol_short!("TASKS")).unwrap_or(Vec::new(&env));
        let id = tasks.len() as u32 + 1;

        let new_item = TodoItem {
            id,
            text,
            completed: false,
            owner: owner.clone(),
        };

        tasks.push_back(new_item);
        env.storage().instance().set(&symbol_short!("TASKS"), &tasks);
        id
    }

    /// Toggles the completion status of a task
    pub fn toggle_task(env: Env, owner: Address, id: u32) {
        owner.require_auth();

        let mut tasks: Vec<TodoItem> = env.storage().instance().get(&symbol_short!("TASKS")).unwrap_or(Vec::new(&env));
        let mut found = false;

        for i in 0..tasks.len() {
            let mut item = tasks.get(i).unwrap();
            if item.id == id && item.owner == owner {
                item.completed = !item.completed;
                tasks.set(i, item);
                found = true;
                break;
            }
        }

        if found {
            env.storage().instance().set(&symbol_short!("TASKS"), &tasks);
        }
    }

    /// Deletes a task
    pub fn delete_task(env: Env, owner: Address, id: u32) {
        owner.require_auth();

        let tasks: Vec<TodoItem> = env.storage().instance().get(&symbol_short!("TASKS")).unwrap_or(Vec::new(&env));
        let mut new_tasks: Vec<TodoItem> = Vec::new(&env);

        for i in 0..tasks.len() {
            let item = tasks.get(i).unwrap();
            if item.id == id && item.owner == owner {
                continue; // Skip the item to delete
            }
            new_tasks.push_back(item);
        }

        env.storage().instance().set(&symbol_short!("TASKS"), &new_tasks);
    }

    /// Fetches all tasks for a specific address
    pub fn get_tasks(env: Env, owner: Address) -> Vec<TodoItem> {
        let tasks: Vec<TodoItem> = env.storage().instance().get(&symbol_short!("TASKS")).unwrap_or(Vec::new(&env));
        let mut user_tasks: Vec<TodoItem> = Vec::new(&env);

        for i in 0..tasks.len() {
            let item = tasks.get(i).unwrap();
            if item.owner == owner {
                user_tasks.push_back(item);
            }
        }

        user_tasks
    }
}
