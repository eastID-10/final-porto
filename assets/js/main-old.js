 
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
 
// preloader
window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  preloader.style.display = "none"; // Hide the preloader
});
window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  preloader.classList.add("fade-out");

  // Wait for the fade-out animation to finish before hiding the element
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500); // Match the transition duration
});
