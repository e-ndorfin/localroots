#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(not(target_arch = "wasm32"))]
extern crate std;

use xrpl_wasm_std::core::current_tx::contract_call::get_current_contract_call;
use xrpl_wasm_std::core::current_tx::traits::ContractCallFields;
use xrpl_wasm_std::core::data::codec::{get_data, set_data};
use xrpl_wasm_std::host::trace::trace;

// Storage keys
const VAULT_TOTAL_KEY: &str = "vault_total";
const VAULT_MEMBERS_KEY: &str = "vault_members";

const SUCCESS: i32 = 0;
const ERROR: i32 = -1;

// --- Helpers (same read-modify-write pattern as counter contract) ---

fn read_vault_total() -> u64 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    match get_data::<u64>(&account, VAULT_TOTAL_KEY) {
        Some(value) => value,
        None => 0,
    }
}

fn write_vault_total(value: u64) -> i32 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    match set_data::<u64>(&account, VAULT_TOTAL_KEY, value) {
        Ok(_) => SUCCESS,
        Err(e) => e,
    }
}

fn read_member_count() -> u32 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    match get_data::<u32>(&account, VAULT_MEMBERS_KEY) {
        Some(value) => value,
        None => 0,
    }
}

fn write_member_count(value: u32) -> i32 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    match set_data::<u32>(&account, VAULT_MEMBERS_KEY, value) {
        Ok(_) => SUCCESS,
        Err(e) => e,
    }
}

/// Build per-lender storage key from address hash.
/// Key format: "vm_XXXXXXXX" — 11 bytes total.
fn lender_key_str(addr_hash: u32) -> &'static str {
    static mut BUF: [u8; 11] = [0; 11]; // "vm_" + 8 hex chars
    let hex_chars = b"0123456789abcdef";
    unsafe {
        BUF[0] = b'v';
        BUF[1] = b'm';
        BUF[2] = b'_';
        let mut h = addr_hash;
        for i in (3..11).rev() {
            BUF[i] = hex_chars[(h & 0xF) as usize];
            h >>= 4;
        }
        core::str::from_utf8_unchecked(core::slice::from_raw_parts(&raw const BUF as *const u8, 11))
    }
}

fn read_lender_balance(addr_hash: u32) -> u64 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    let key = lender_key_str(addr_hash);
    match get_data::<u64>(&account, key) {
        Some(value) => value,
        None => 0,
    }
}

fn write_lender_balance(addr_hash: u32, value: u64) -> i32 {
    let contract_call = get_current_contract_call();
    let account = contract_call.get_contract_account().unwrap();
    let key = lender_key_str(addr_hash);
    match set_data::<u64>(&account, key, value) {
        Ok(_) => SUCCESS,
        Err(e) => e,
    }
}

// --- Exported Functions ---

/// @xrpl-function deposit
/// Adds amount to vault total and to a specific lender's balance.
/// Amount is in cents (1 = $0.01) so u32 precision covers up to ~$21M.
/// If this is a new lender (balance was 0), increments member count.
#[unsafe(no_mangle)]
pub extern "C" fn deposit(amount: u32, addr_hash: u32) -> i32 {
    if amount == 0 {
        let _ = trace("Deposit amount must be > 0");
        return ERROR;
    }

    let current_total = read_vault_total();
    let new_total = current_total + amount as u64;

    let result = write_vault_total(new_total);
    if result != SUCCESS {
        let _ = trace("Failed to update vault total");
        return ERROR;
    }

    let current_balance = read_lender_balance(addr_hash);

    // New lender — increment member count
    if current_balance == 0 {
        let members = read_member_count();
        let res = write_member_count(members + 1);
        if res != SUCCESS {
            let _ = trace("Failed to update member count");
            return ERROR;
        }
    }

    let new_balance = current_balance + amount as u64;
    let result = write_lender_balance(addr_hash, new_balance);
    if result != SUCCESS {
        let _ = trace("Failed to update lender balance");
        return ERROR;
    }

    let _ = trace("Deposit recorded");
    (new_total & 0x7FFFFFFF) as i32
}

/// @xrpl-function withdraw
/// Subtracts amount from vault total and from lender's balance.
/// If lender balance reaches 0, decrements member count.
#[unsafe(no_mangle)]
pub extern "C" fn withdraw(amount: u32, addr_hash: u32) -> i32 {
    if amount == 0 {
        let _ = trace("Withdraw amount must be > 0");
        return ERROR;
    }

    let current_balance = read_lender_balance(addr_hash);
    if (amount as u64) > current_balance {
        let _ = trace("Insufficient lender balance");
        return ERROR;
    }

    let current_total = read_vault_total();
    if (amount as u64) > current_total {
        let _ = trace("Insufficient vault total");
        return ERROR;
    }

    let new_total = current_total - amount as u64;
    let result = write_vault_total(new_total);
    if result != SUCCESS {
        let _ = trace("Failed to update vault total");
        return ERROR;
    }

    let new_balance = current_balance - amount as u64;
    let result = write_lender_balance(addr_hash, new_balance);
    if result != SUCCESS {
        let _ = trace("Failed to update lender balance");
        return ERROR;
    }

    // Lender fully withdrawn — decrement member count
    if new_balance == 0 {
        let members = read_member_count();
        if members > 0 {
            let res = write_member_count(members - 1);
            if res != SUCCESS {
                let _ = trace("Failed to update member count");
                return ERROR;
            }
        }
    }

    let _ = trace("Withdrawal recorded");
    (new_total & 0x7FFFFFFF) as i32
}

/// @xrpl-function get_vault_total
/// Returns the total RLUSD pooled in the vault (in cents), truncated to i32.
#[unsafe(no_mangle)]
pub extern "C" fn get_vault_total() -> i32 {
    let total = read_vault_total();
    let _ = trace("Getting vault total");
    (total & 0x7FFFFFFF) as i32
}

/// @xrpl-function get_lender_balance
/// Returns a specific lender's contribution balance (in cents), truncated to i32.
#[unsafe(no_mangle)]
pub extern "C" fn get_lender_balance(addr_hash: u32) -> i32 {
    let balance = read_lender_balance(addr_hash);
    let _ = trace("Getting lender balance");
    (balance & 0x7FFFFFFF) as i32
}
