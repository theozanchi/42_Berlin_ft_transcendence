document.addEventListener('DOMContentLoaded', function () {
    var user_id = document.body.getAttribute('data-user-id');
    if (user_id) {
        removeFriend(user_id);
    }
});


function removeFriend(user_id) {
    fetch(`/api/user_mgt/remove_friend/`, {
        method: 'POST', headers: {
            'friend': user_id,
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
    })
        .then(response => {
            if (response.ok && response.headers.get("Content-Type").includes("application/json")) {
                return response.json();
            }
            throw new Error('Non-JSON response received');
        })
        .then(data => {
            alert(data.message);
            if (data.status === "success") {
            }
        })
        .catch(error => console.error('Error:', error));
}
