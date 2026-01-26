from _bootstrap import add_backend_to_path

add_backend_to_path()

from database import init_db
from models import UserModel, RoleModel


def main() -> None:
    init_db()
    print("Database initialized")

    admin_email = "admin@admin.com"
    admin_password = "admin123"
    admin_name = "Admin User"

    existing = UserModel.get_by_email(admin_email)
    if existing:
        admin_id = existing["id"]
        print(f"Admin exists: {admin_email}")
    else:
        admin_id = UserModel.create(email=admin_email, password=admin_password, full_name=admin_name)
        if not admin_id:
            print("Failed to create admin user")
            return
        print(f"Created admin user: {admin_email}")

    if RoleModel.set_single_role(admin_id, "admin"):
        print("Assigned admin role")
    else:
        print("Failed to assign admin role")


if __name__ == "__main__":
    main()
