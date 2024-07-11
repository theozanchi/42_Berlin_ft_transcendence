document.addEventListener('DOMContentLoaded', function () {
    var user_id = document.body.getAttribute('data-user-id');
    if (user_id) {
        addFriend(user_id);

    }
});

function addFriend(user_id) {
    fetch(`/api/user_mgt/add_friend/${user_id}/`, {
        method: 'POST', headers: {
            'Content-Type': 'application/json'
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
