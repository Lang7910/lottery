from main import app
print("Dumping all routes:")
for route in app.routes:
    if hasattr(route, "path"):
        print(f"Path: {route.path} | Methods: {route.methods}")
