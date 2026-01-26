from typing import Dict, List

DEFAULT_ROLES: List[str] = [
    "super_admin",
    "admin",
    "manager",
    "user",
]

DEFAULT_PERMISSIONS: List[str] = [
    "admin.access",
    "users.read",
    "users.update",
    "users.delete",
    "users.roles.manage",
    "products.manage",
    "orders.read",
    "orders.manage",
    "bots.manage",
    "support.manage",
    "analytics.read",
    "system.manage",
    "profile.read",
    "profile.update",
    "orders.own",
    "bots.own",
    "support.own",
]

DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "super_admin": DEFAULT_PERMISSIONS,
    "admin": [
        "admin.access",
        "users.read",
        "users.update",
        "users.roles.manage",
        "products.manage",
        "orders.read",
        "orders.manage",
        "bots.manage",
        "support.manage",
        "analytics.read",
        "profile.read",
        "profile.update",
    ],
    "manager": [
        "users.read",
        "orders.read",
        "orders.manage",
        "support.manage",
        "analytics.read",
        "profile.read",
        "profile.update",
    ],
    "user": [
        "profile.read",
        "profile.update",
        "orders.own",
        "bots.own",
        "support.own",
    ],
}
