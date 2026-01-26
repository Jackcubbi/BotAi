Utility scripts for local maintenance and inspection.

These scripts are optional and are not required to run the API server.

Run from the backend folder, for example:

- `python scripts/check_database.py`
- `python scripts/check_admin.py`
- `python scripts/fetch_users.py`
- `python scripts/init_database.py`
- `python scripts/reset_admin_password.py`

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
