 
function sendEmail() {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;

  if (username && message) {
    const subject = encodeURIComponent(`Message from ${username}`);
    const body = encodeURIComponent(message);
    const mailtoLink = `mailto:eastidmyt@gmail.com?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;
  } else {
    alert("Please fill out all fields before sending.");
  }
}
  