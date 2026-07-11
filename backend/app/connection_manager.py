from fastapi import WebSocket


class ConnectionManager:
    """
    Keeps track of all connected WebSocket clients (e.g., multiple tabs open in the React dashboard)
    and provides the ability to broadcast a message to all of them.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # a copy of the list is created to avoid issues if a connection is removed during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                # if a connection is closed or fails, we remove it from the list
                self.disconnect(connection)


# a singleton instance of ConnectionManager that can be imported and used in other modules
manager = ConnectionManager()