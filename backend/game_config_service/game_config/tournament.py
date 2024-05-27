
class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def generate_tournament_tree(player_count, players):
    # Base case: if only one player, return a leaf node
    if player_count == 1:
        return TreeNode(players[0])

    # Create a new node for this round
    round_node = TreeNode(None)

    # Recursively generate left and right subtrees
    left_players = players[:player_count // 2]
    right_players = players[player_count // 2:]
    round_node.left = generate_tournament_tree(len(left_players), left_players)
    round_node.right = generate_tournament_tree(len(right_players), right_players)

    return round_node

def serialize_tree(root):
    if root is None:
        return None

    serialized = {
        "value": root.value,
        "left": serialize_tree(root.left),
        "right": serialize_tree(root.right)
    }

    return serialized