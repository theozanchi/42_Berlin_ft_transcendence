document.addEventListener('DOMContentLoaded', function() {
    var userId = "{{ userId }}"; // Using Django template variable
    if (userId) {
        addFriend(userId);
    }
});



function removeFriend(userId) {
    fetch(`/remove_friend/${userId}/`, {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.status === "success") {
            }
        })
		.catch(error => console.error('Error:', error));
}