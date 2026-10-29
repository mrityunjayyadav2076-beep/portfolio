const year = document.getElementById("year");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.getElementById("primary-nav");
const contactForm = document.getElementById("contactForm");
const welcomeButton = document.getElementById("welcomeButton");
const welcomeStatus = document.getElementById("welcomeStatus");
const heroArt = document.querySelector(".hero-art");

year.textContent = new Date().getFullYear();

function setNavigationOpen(isOpen) {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
    navigation.classList.toggle("is-open", isOpen);
}

menuToggle.addEventListener("click", function () {
    setNavigationOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

navigation.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
        setNavigationOpen(false);
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        setNavigationOpen(false);
    }
});

if (heroArt && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroArt.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") {
            return;
        }

        const bounds = heroArt.getBoundingClientRect();
        const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
        const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

        heroArt.style.setProperty("--tilt-x", `${-vertical * 8}deg`);
        heroArt.style.setProperty("--tilt-y", `${horizontal * 8}deg`);
    });

    heroArt.addEventListener("pointerleave", function () {
        heroArt.style.setProperty("--tilt-x", "0deg");
        heroArt.style.setProperty("--tilt-y", "0deg");
    });
}

let welcomeTimeout;
let audioSuspendTimeout;
let welcomeAudioContext;

async function playWelcome(includeChime, automatic) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        welcomeStatus.textContent = automatic
            ? "Select Hear the welcome to try audio in your browser."
            : "Welcome audio isn’t supported by this browser.";
        return false;
    }

    window.clearTimeout(welcomeTimeout);
    window.speechSynthesis.cancel();
    welcomeButton.setAttribute("aria-busy", "true");
    welcomeStatus.textContent = "Playing your welcome…";

    try {
        if (includeChime && "AudioContext" in window) {
            welcomeAudioContext = welcomeAudioContext || new AudioContext();
            window.clearTimeout(audioSuspendTimeout);
            await welcomeAudioContext.resume();

            [523.25, 659.25, 783.99].forEach(function (frequency, index) {
                const startTime = welcomeAudioContext.currentTime + index * 0.12;
                const oscillator = welcomeAudioContext.createOscillator();
                const volume = welcomeAudioContext.createGain();

                oscillator.type = "sine";
                oscillator.frequency.value = frequency;
                volume.gain.setValueAtTime(0.0001, startTime);
                volume.gain.exponentialRampToValueAtTime(0.08, startTime + 0.04);
                volume.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);
                oscillator.connect(volume);
                volume.connect(welcomeAudioContext.destination);
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.67);
            });

            audioSuspendTimeout = window.setTimeout(function () {
                welcomeAudioContext.suspend();
            }, 1800);
        }

        const greeting = new SpeechSynthesisUtterance(
            "Welcome to Mrityunjay Yadav's portfolio."
        );
        const englishVoice = window.speechSynthesis.getVoices().find(
            function (voice) {
                return voice.lang.toLowerCase() === "en-in";
            }
        ) || window.speechSynthesis.getVoices().find(function (voice) {
            return voice.lang.toLowerCase().startsWith("en");
        });

        if (englishVoice) {
            greeting.voice = englishVoice;
        }

        greeting.rate = 0.95;
        greeting.pitch = 1.05;
        greeting.onend = function () {
            welcomeButton.removeAttribute("aria-busy");
            welcomeStatus.textContent = "Welcome to Mrityunjay Yadav's portfolio.";
        };
        greeting.onerror = function (event) {
            welcomeButton.removeAttribute("aria-busy");
            welcomeStatus.textContent = automatic && event.error === "not-allowed"
                ? "Your browser blocked autoplay. Select Hear the welcome to play it."
                : "The welcome audio couldn’t be played. Select Hear the welcome to try again.";
        };

        window.speechSynthesis.speak(greeting);
        return true;
    } catch (error) {
        welcomeButton.removeAttribute("aria-busy");
        welcomeStatus.textContent = automatic
            ? "Autoplay wasn’t available. Select Hear the welcome to play it."
            : "The welcome audio couldn’t be played.";
        console.error("Unable to play the welcome audio.", error);
        return false;
    }
}

welcomeButton.addEventListener("click", function () {
    playWelcome(true, false);
});

let hasAutoPlayedWelcome = false;
try {
    hasAutoPlayedWelcome = sessionStorage.getItem("my-portfolio-welcome-played") === "true";
    if (!hasAutoPlayedWelcome) {
        sessionStorage.setItem("my-portfolio-welcome-played", "true");
    }
} catch (error) {
    console.warn("Could not check the welcome audio visit state.", error);
}

if (!hasAutoPlayedWelcome) {
    playWelcome(false, true);
}

contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const formMessage = document.getElementById("formMessage");

    if (!contactForm.reportValidity()) {
        return;
    }

    formMessage.textContent =
        "Thanks, " + name + ". This demo form isn’t connected to a mail service yet.";
    contactForm.reset();
});
