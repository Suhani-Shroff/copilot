document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear select options before populating to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        // Populate participants list safely
        const participantsListEl = activityCard.querySelector(".participants-list");
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            
            const participantSpan = document.createElement("span");
            // participant may be a string or an object with name/email
            if (p && typeof p === "object") {
              participantSpan.textContent = p.name || p.email || JSON.stringify(p);
            } else {
              participantSpan.textContent = String(p);
            }
            li.appendChild(participantSpan);

            // Add delete icon/button
            const deleteBtn = document.createElement("span");
            deleteBtn.textContent = "✕";
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Unregister participant";
            deleteBtn.onclick = async () => {
              const email = participantSpan.textContent;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(email)}`,
                  {
                    method: "DELETE",
                  }
                );

                if (response.ok) {
                  li.remove();
                  // Show message if list is now empty
                  if (participantsListEl.children.length === 0) {
                    const empty = document.createElement("div");
                    empty.className = "participants-empty";
                    empty.textContent = "No participants yet";
                    participantsListEl.appendChild(empty);
                  }
                  
                  messageDiv.textContent = `Unregistered ${email} from ${name}`;
                  messageDiv.className = "message success";
                } else {
                  const result = await response.json();
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "message error";
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);
              } catch (error) {
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering:", error);
              }
            };
            li.appendChild(deleteBtn);

            participantsListEl.appendChild(li);
          });
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet";
          participantsListEl.appendChild(empty);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
