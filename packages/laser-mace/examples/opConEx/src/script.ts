import { attachOnClick, DataConnectionPlus, expose, getRandomName, getSafeValueById, MsgType, PeerNetObj } from '../../../dist'

const localURL = "http://localhost:3000/";
const liveURL = "https://solid-operator.vercel.app/";
const operatorURL = ((document.URL.indexOf("localhost") > -1 ? localURL : liveURL) + "api/operator/check-in/");

const PeerNet = PeerNetObj(operatorURL);
PeerNet.SetHandleMessage(handleMessage);
expose({ PeerNet });

attachOnClick('connectBtn', connect, []);
attachOnClick('rndNameBtn', rndName, [], setName, []);
attachOnClick('goNutsBtn', goNuts, []);

function goNuts() {
    const collection = [];
    for (let i = 0; i < 100; i++) {
        collection.push(getRandomName());
    }
    console.log(collection.sort())
}

function connect(): void {
    let playerName = getSafeValueById('playerName', "unknownName")!;
    if (playerName == "unknownName" || playerName == ""){
        const newName = getRandomName();
        setName(newName);
        playerName = newName;
    }
    const roomName = getSafeValueById('roomName', "unknownRoom")!;
    
    PeerNet.Connect(roomName, playerName);
    console.log(`Connecting to room: ${roomName}, as player: ${playerName} \n`, getSafeValueById('roomName'), getSafeValueById('playerName'));
}

function rndName() {
    return getRandomName();
}

function setName(name: string) {
    (document.getElementById('playerName') as HTMLInputElement).value = name;
}

function handleMessage(senderCon: DataConnectionPlus, msg: MsgType) {
    console.log("Got a message!", msg, "From:", senderCon);
}