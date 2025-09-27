import { log, logLevels } from "./logging";
import { randomItem } from "./random";

type PartOfSpeech = "adjective" | "noun";

// Define the Cooldown type
interface Cooldown {
    word: string;
    wordType: PartOfSpeech;
    expiresAt: number; // Use a timestamp for when the cooldown expires
}

// Cooldown duration in milliseconds
const COOLDOWN_DURATION = 5000; // Example: 5 seconds

interface wordTypesInterface {
    adjective: PartOfSpeech,
    noun: PartOfSpeech
}

const wordTypes: wordTypesInterface = {
    adjective: "adjective",
    noun: "noun"
};

const wordCooldowns: Cooldown[] = [];

const wordBank = {
    [wordTypes.adjective]: {
        manual: [
            "Lunar", "Shiniest", "Derpy", "Ironic", "Impulsive", "Mischievous", "Wandering", "Daring", "Dangerous", "Hipster", "Obnoxious", "Crabby", "Magical", "Rotund", "Teenage", "Veiled", "Misty", "Loud", "Chivalrous", "Handsome", "Quirky", "Disgruntled", "Overripe", "American", "Bouncy", "Bedazzled", "Gelatinous", "Tragic", "Historical", "Over-eager", "Hungry", "Stripiest", "Versatile", "Juggling", "Time-traveling", "Ignorant", "Bodacious", "Clever", "First-rate", "Hunted", "Haunted", "Sticky", "Contemptuous", "Camouflaged", "Cheeky", "Punchy", "Peachy", "Valiant", "Stumpy", "Illuminated", "Carnivorous", "Gentle", "Grim", "Killer", "Double-fisted", "Steam-punk", "Righteous", "Excellent", "Looming", "Despicable", "Sharp-shooting", "Dare-devil", "Romantic", "Maniacal", "Narcoleptic", "Sugar-coated", "Paranoid", "Grumpy", "Forgetful", "Indulgent", "Fortuitous", "Shady", "Lethargic", "Cross-eyed", "Devilish", "Bumbling", "Scruffy-Looking"
        ],
        generated: [
            "Ambitious", "Benevolent", "Courageous", "Diligent", "Ethereal", "Fanciful", "Gleaming", "Harmonious",
            "Innovative", "Jovial", "Keen", "Lustrous", "Majestic", "Nimble", "Opulent", "Perceptive", "Quaint",
            "Radiant", "Savvy", "Tenacious", "Unyielding", "Vibrant", "Witty", "Youthful", "Zealous", "Adventurous",
            "Blissful", "Cheerful", "Devoted", "Eager", "Fearless", "Gracious", "Heroic", "Imaginative", "Joyful",
            "Knowledgeable", "Lively", "Mirthful", "Noteworthy", "Optimistic", "Playful", "Quick-witted", "Resilient",
            "Sincere", "Trustworthy", "Unique", "Valiant", "Warm-hearted", "Xenial", "Zestful"
        ]
    },
    [wordTypes.noun]: {
        manual: [
            "Dessert", "Cobra", "Paratrooper", "Lemur", "Orca", "Curtains", "Monk", "Lieutenant", "Drill Sergeant", "Lumberjack", "Oboe", "Cyclops", "Mutant", "Alien", "Sugar Glider", "Postal Worker", "Garlic", "Muffin", "Wizard", "Icicle", "Sunbeam", "Vegetable", "Ogre", "Compass", "Shovel", "Slinky", "Nerf-herder", "Nerfgun", "Corgi", "Champion", "Sniper", "Politician", "Waitress", "Luggage", "Watermelon", "Armadillo", "Soldier", "Concertmaster", "Nurse", "Cubicle", "Gorilla", "Vampire", "Twinkie", "Ninja", "Panda", "Penguin", "Freeloader", "Kitten", "Loofah", "Starfish", "Doughnut", "Asteroid", "Pop Star", "Redneck", "Goldfish", "Doppleganger", "Warrior", "Banjo", "Sleeping Bag", "Raisin", "Ballerina", "Code Monkey", "Beached Whale", "Matador", "Side-kick", "Carnival Worker", "Shoe Shiner", "Swimmer", "Hotspur", "Cowboy", "Gymnast", "Blockhead", "Slacker"
        ],
        generated: [
            "Phoenix", "Dragon", "Hawk", "Raven", "Wolf", "Tiger", "Lion", "Panther", "Bear", "Falcon",
            "Shark", "Eagle", "Viper", "Scorpion", "Cheetah", "Jaguar", "Buffalo", "Rhino", "Koala", "Chameleon",
            "Puma", "Cobra", "Lynx", "Pelican", "Walrus", "Turtle", "Antelope", "Crane", "Flamingo", "Peacock",
            "Hyena", "Giraffe", "Moose", "Penguin", "Wolverine", "Leopard", "Fox", "Hedgehog", "Dolphin", "Otter",
            "Seal", "Parrot", "Kangaroo", "Elephant", "Horse", "Crocodile", "Alligator", "Beaver", "Meerkat", "Albatross"
        ]
    }
}

export function getRandomName(separator = " ") {
    return getRandomWord(wordTypes.adjective) + separator + getRandomWord(wordTypes.noun);
}

function getRandomWord(wordType: PartOfSpeech) {
    const options = getOptions(wordType);
    const chosenWord = randomItem(options);
    setCooldown(chosenWord, wordType);
    log(logLevels.debug, `Random "${wordType}" "${chosenWord}", has been chosen from ${options}`, ["getRandomWord", "rndName"], [wordCooldowns]);
    return chosenWord;
}

function getOptions(wordType: PartOfSpeech) {
    const options = [...wordBank[wordType].manual, ...wordBank[wordType].generated]
    return applyCooldowns(options, wordType);
}

function applyCooldowns(options: string[], wordType: PartOfSpeech): string[] {
    // Remove expired cooldowns
    const now = Date.now();
    wordCooldowns.forEach((cooldown, index) => {
        if (cooldown.expiresAt <= now) {
            wordCooldowns.splice(index, 1);
        }
    });

    // Filter out words that are currently on cooldown
    const filteredOptions = options.filter(option =>
        !wordCooldowns.some(cooldown => cooldown.word === option && cooldown.wordType === wordType)
    );

    // Log a warning if the filtered list is empty
    if (filteredOptions.length === 0) {
        log(
            logLevels.warning,
            `Filtered list is empty for word type "${wordType}". Ignoring cooldowns.`,
            ["applyCooldowns", "cooldowns"],
            { options, wordType }
        );
    }

    // If filtered options are empty, return the original options (ignoring cooldowns)
    return filteredOptions.length > 0 ? filteredOptions : options;
}


function setCooldown(option: string, wordType: PartOfSpeech) {
    const now = Date.now();
    const cooldown: Cooldown = {
        word: option,
        wordType,
        expiresAt: now + COOLDOWN_DURATION // Set expiration time
    };
    wordCooldowns.push(cooldown);
}