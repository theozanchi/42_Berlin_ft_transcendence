class GameException(Exception):
    """Base class for other exceptions"""
    pass

class InsufficientPlayersError(GameException):
    """Raised when a game does not have enough players"""
    def __init__(self, message="A game must have at least 2 players"):
        self.message = message
        super().__init__(self.message)
