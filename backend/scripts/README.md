Utility scripts for local maintenance and inspection.

These scripts are optional and are not required to run the API server.

Run from the backend folder, for example:

- `python scripts/check_database.py`
- `python scripts/check_auth_flow.py --base-url https://botai.rostsin.com --email you@example.com --password yourPassword`
- `python scripts/show_all_bots.py`
- `python scripts/show_all_users.py`
- `python scripts/check_admin.py`
- `python scripts/fetch_users.py`
- `python scripts/init_database.py`
- `python scripts/reset_admin_password.py`
- `python scripts/reset_user_password.py --email user@example.com --password NewPassword123`
- `python scripts/production_diagnostics.py --base-url https://botai.rostsin.com`
- `python scripts/repair_passenger_wsgi.py`
- `python scripts/dedupe_marketplace_bots.py` (dry-run)
- `python scripts/dedupe_marketplace_bots.py --apply` (apply changes)

Core runtime files stay at backend root:

- `main.py`
- `config.py`
- `database.py`
- `models.py`
- `schemas.py`
- `rbac.py`
- `routes/`
- `middleware/`
- `services/`
