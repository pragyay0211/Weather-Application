document.addEventListener("DOMContentLoaded", function () {
    const wrapper = document.querySelector(".wrapper");
    const cityInputs = wrapper.querySelectorAll(".city-inputs input");
    const selectCitiesBtn = wrapper.querySelector(".select-cities-btn");
    const weatherCardsContainer = wrapper.querySelector(".weather-cards");

    const API_KEY = "192e3aaf21ff4c0eaab95337240503"; // Replace with your weatherapi.com API key
    const API_URL = "https://api.weatherapi.com/v1/current.json";
    const WS_URL = "ws://localhost:8080"; // WebSocket server URL

    const ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => {
        console.log('WebSocket connection established');
    });

    ws.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.city && data.message) {
                console.log(`Received notification for ${data.city}: ${data.message}`);
                // Handle notification, for now let's just log it
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error.message);
        }
    });

    selectCitiesBtn.addEventListener("click", () => {
        const cities = [];
        cityInputs.forEach((input) => {
            if (input.value.trim() !== "") {
                cities.push(input.value.trim());
            }
        });

        if (cities.length > 0) {
            const payload = {
                locations: cities.map((city) => {
                    return {
                        q: city,
                        custom_id: city.replace(/\s+/g, "-").toLowerCase(),
                    };
                }),
            };

            fetchWeatherBulk(payload);
        } else {
            displayError("Please enter at least one city.");
        }
    });

    function fetchWeatherBulk(payload) {
        const url = new URL(API_URL);
        url.searchParams.append("key", API_KEY);
        url.searchParams.append("q", "bulk");

        fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Request failed: " + response.status);
                }
                return response.json();
            })
            .then((data) => {
                if (data.error) {
                    throw new Error(data.error.message);
                }
                displayWeatherBulk(data.bulk);
            })
            .catch((error) => {
                displayError("Error fetching data: " + error.message);
            });
    }

    function displayWeatherBulk(weatherData) {
        weatherCardsContainer.innerHTML = ""; // Clear existing weather cards

        weatherData.forEach((item) => {
            const { query: { custom_id, location, current } } = item;

            const weatherCard = document.createElement("div");
            weatherCard.classList.add("weather-card");

            weatherCard.innerHTML = `
                <img class="weather-icon" src="${current.condition.icon}" alt="Weather Icon">
                <div class="temp">${current.temp_c}°C</div>
                <div class="weather">${current.condition.text}</div>
                <div class="location">${location.name}, ${location.country}</div>
                <div class="bottom-details">
                    <div class="column feels">
                        <div class="details">
                            <div class="temp">${current.feelslike_c}°C</div>
                            <p>Feels like</p>
                        </div>
                    </div>
                    <div class="column humidity">
                        <div class="details">
                            <span class="humidity_percent">${current.humidity}%</span>
                            <p>Humidity</p>
                        </div>
                    </div>
                </div>
                <div class="notification-settings">
                    <label>
                        <input type="checkbox" class="notification-checkbox" data-city="${location.name}">
                        Receive notifications for this city
                    </label>
                    <div class="notification-conditions">
                        <label>
                            <input type="checkbox" class="notification-condition" data-condition="Rain">
                            Rain
                        </label>
                        <label>
                            <input type="checkbox" class="notification-condition" data-condition="Snow">
                            Snow
                        </label>
                        <label>
                            <input type="checkbox" class="notification-condition" data-condition="Extreme">
                            Extreme Temperature
                        </label>
                    </div>
                </div>
            `;

            weatherCardsContainer.appendChild(weatherCard);
        });

        // Add event listeners for notification checkboxes
        const notificationCheckboxes = document.querySelectorAll(".notification-checkbox");
        notificationCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                const city = checkbox.getAttribute("data-city");
                if (checkbox.checked) {
                    // Subscribe to notifications for this city
                    subscribeToNotifications(city);
                } else {
                    // Unsubscribe from notifications for this city
                    unsubscribeFromNotifications(city);
                }
            });
        });
    }

    function subscribeToNotifications(city) {
        console.log(`Subscribing to notifications for ${city}`);
        const message = JSON.stringify({ action: 'subscribe', city });
        ws.send(message);
    }

    function unsubscribeFromNotifications(city) {
        console.log(`Unsubscribing from notifications for ${city}`);
        const message = JSON.stringify({ action: 'unsubscribe' });
        ws.send(message);
    }

    function displayError(message) {
        console.error("Error:", message);
        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error");
        errorDiv.innerText = message;
        weatherCardsContainer.appendChild(errorDiv);
    }
});
