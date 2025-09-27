import Peer from "peerjs";
import { log, logLevels } from "./logging";
// Define a type for the handler functions
type HandlerFunction = (...args: any[]) => void;

import type PeerInternal from 'peerjs';

type DataConnection = ConstructorParameters<typeof PeerInternal>[0] extends any
  ? ReturnType<typeof PeerInternal.prototype.connect>
  : never;


// Define a type for the objects stored in the handler arrays
interface HandlerObject {
    durable: boolean;
    func: HandlerFunction;
    args: any[]
}

// Define a type for the _Handlers object to map strings to an array of HandlerObject
interface Handlers {
    //Got Msg over Peer Connection 
    OnMsg: HandlerObject[];
    //New Connection Established
    OnConnect: HandlerObject[];
    //Peer Connection Disconnected 
    OnDisconnect: HandlerObject[];
    //Fires any time the connections collection is updated 
    OnConnectionUpdate: HandlerObject[];
    //On Checkin response from Operator 
    OnCheckIn: HandlerObject[];
    //On Peernet Status Change 
    OnStatusChange: HandlerObject[];
    //When PeerJs assigns you your connection string... 
    OnPeerConnectionStringSet: HandlerObject[];
    //When the leader of this room changes (Might call on connect)
    OnLeaderChange: HandlerObject[];
    //If you become to cease being the leader 
    OnMyLeaderStatusChange: HandlerObject[];
}

export function newPeerNet(params?: {url?: string, handleMessageFunc?: (senderConn: DataConnectionPlus, msg: MsgType) => void}) {
    const handleMessageFunc = params?.handleMessageFunc || undefined;
    const localURL = process.env.OperatorUrlLocal;
    const liveURL = process.env.OperatorUrlLive;
    const operatorURL = params?.url || ((document.URL.indexOf("localhost") > -1 ? localURL : liveURL));

    if (!operatorURL || operatorURL.length < 1){
        log(logLevels.error, `Unable to get an operatorURL, please check your env file values for OperatorUrlLocal/OperatorUrlLive or provide a URL manually`, ['newPeerNet'], params)
        return null;
    }

    const PeerNet = PeerNetObj(operatorURL);
    if (handleMessageFunc){
        PeerNet.SetHandleMessage(handleMessageFunc);
    }
    else{
        log(logLevels.debug, "PeerNetObj created but handleMessage not set.", ['newPeerNet'])
    }
    return PeerNet;
}

export type PeerNetStatusObj = {
    Phase: number;
    Text: string;
}

export type PeerNetObjType = {
    SetRoom: (roomName: string) => void;
    SetHandler: (handlerName: keyof Handlers, functionToCall: HandlerFunction, ...args: any[]) => void;
    GetPeerId: () => string | null;
    _SendMsgToOperator: (msg: any) => void;
    ForceCheckin: () => void;
    SetHandleMessage: (func: (senderConn: DataConnectionPlus, msg: MsgType) => void) => void;
    GetActivePeers: () => Map<string, DataConnectionPlus>;
    GetPeers: () => Map<string, DataConnectionPlus>;
    SetOperatorURL: (url: string) => void;
    ResetName: (newName: string) => void;
    Send: (targetConn: DataConnectionPlus, msg: MsgType) => void;
    Disconnect: (roomName: string) => void;
    Connect: (roomName: string, playerName: string) => void;
    GetDisplayName: () => string;
    IsLeader: () => boolean;
    GetOrderNumber: () => number | undefined;
}
export type DataConnectionPlus = {
    ConnId: string;
    IsLeader: boolean | null;
    DisplayName: string | null;
    PeerConnectionString: string | null;
    LastMsgDT: number | null;
    PeerConnection: DataConnection | null;
    Active: boolean;
    Room: string | null;
    Status: PeerConnectionStatus;
    OrderNumber: number | undefined;
};

type PeerConnectionStatus = "Awaiting-Introduction" | "Unknown" | "Disconnected" | "Introduced" | undefined;

export type MsgType = {
    Type: string;
    Data?: any;
}

export function PeerNetObj(operatorURL: string): PeerNetObjType {
    let _OperatorURL = operatorURL;
    let _DisplayName = '';
    let _ConnId: string;
    let _IsLeader = false;
    let _OrderNumber: number | undefined;
    let _CurrentLeaderId: string | undefined;
    let _CheckInIntervalHandle: string | number | NodeJS.Timeout | undefined;
    let _ExpireConnectionsIntervalHandle = setInterval(expireConnections, 1000);
    let _RoomName: string;
    let _PeerConnectionString: null | string = null;
    let _Peer = setupPeer();
    let _Status = { Phase: 0, Text: "Disconnected" };
    let _assumingLeadership = false;
    let _lastOperatorCheckin = 0;
    const _operatorThrottle = {
        lastMsgToOperatorDT: 0,
        msgsToSendToOperator: [] as object[],
        // How many MS should we group messages together before sending 
        timeLimit: 500,
        delaySendHandle: {},
        shouldSend: () => { return (_operatorThrottle.timeLeft() > 0) },
        timeLeft: () => {
            let diff = (Date.now() - _operatorThrottle.lastMsgToOperatorDT + _operatorThrottle.timeLimit);
            if (diff < 0) {
                diff = 0;
            }
            return diff
        },
        send: () => {
            SendToOperator({ Type: "BulkMsg", Msgs: [..._operatorThrottle.msgsToSendToOperator] });
            console.log("Sending bulk to operator", [..._operatorThrottle.msgsToSendToOperator]);
            _operatorThrottle.msgsToSendToOperator = [];
            _operatorThrottle.lastMsgToOperatorDT = Date.now();
        },
        enqueue: (msgObj: object) => {
            console.log("Adding msg to sendQueue", msgObj);
            _operatorThrottle.msgsToSendToOperator.push(msgObj)
        }
    }

    const newPeerNet = {} as PeerNetObjType;

    function expireConnections() {
        const badStates = ["closed", "disconnected", "failed"];
        for (const [connId, conn] of GetActivePeers()) {
            const dataConn = conn.PeerConnection!
            if ((!dataConn) ||
                (!dataConn.open) ||
                (badStates.includes(dataConn.peerConnection.iceConnectionState)) ||
                (badStates.includes(dataConn.peerConnection.connectionState))) {
                console.log(conn.DisplayName, " is not in a good state. Killing", connId, dataConn.open, dataConn.peerConnection.iceConnectionState, dataConn.peerConnection.connectionState);
                conn.PeerConnection?.close();
                conn.Active = false;
            }
        }
    }

    function GetDisplayName() {
        return _DisplayName;
    }
    newPeerNet.GetDisplayName = GetDisplayName;

    function setupPeer() {
        let newPeer = new Peer();
        newPeer.on("open", function (peerConnectionString: string) {
            setPeerConnectionString(peerConnectionString);
            setStatus(1, "PeerConnectionString Set");
        });
        newPeer.on("connection", handleIncomingPeerCon);
        return newPeer;
    }

    function setStatus(phase: number, text: string) {
        _Status = { Phase: phase, Text: text };
        doHandler("OnStatusChange", { Status: _Status });
    }

    function setPeerConnectionString(peerConnectionString: string | null) {
        _PeerConnectionString = peerConnectionString;
        doHandler("OnPeerConnectionStringSet", _PeerConnectionString);
    }

    function handleIncomingPeerCon(dataConn: DataConnection) {
        console.info("You've been connected to by", dataConn.peer)
        handleNewPeerConnection(dataConn, "Incoming");
    }

    function handleOutgoingPeerCon(dataConn: DataConnection) {
        console.info("You've created a connection with", dataConn.peer)
        handleNewPeerConnection(dataConn, "Outgoing");
    }

    function getConnByPeerConnString(connString: string) {
        for (const [connId, conn] of _Connections) {
            if (conn.PeerConnectionString == connString) {
                return conn;
            }
        }
        return null;
    }

    //Collection point for all new connections, Outgoing and Incoming
    function handleNewPeerConnection(peerConn: DataConnection, conDir: "Incoming" | "Outgoing") {
        let conn = getConnByPeerConnString(peerConn.peer);
        if (conn && !conn.Active) {
            //Close the old connection and store this new one
            if (conn.PeerConnection) {
                conn.PeerConnection.close();
            }
            conn.PeerConnection = peerConn;
            conn.Active = true;
        }
        else {
            //Store the information we have
            conn = NewConnectionObj(peerConn.peer, null, null, peerConn.peer, null, peerConn, true, null, 'Awaiting-Introduction')
        }

        setConnection(conn.ConnId, conn);
        if (conn.Status == 'Introduced' && _IsLeader) {
            SendConnectionListUpdate();
        }

        if (conn == null || conn.PeerConnection == null) {
            console.warn(`conn or conn.PeerConnection is null. Exiting handleNewPeerConnection`, conn);
            return;
        }

        SendIntroduction(conn);

        conn.PeerConnection.on("data", function (data: any) {
            //THIS CONN DOES NOT UPDATE... SO WE HAVE TO GRAB THE LATEST FROM THE CONN LIST 
            const senderConn = getConnByPeerConnString(conn!.PeerConnectionString!) || conn;
            _HandleMsg(data, senderConn);
            conn!.LastMsgDT = Date.now();
        });
        conn.PeerConnection.on("close", function () {
            console.log("Oh snap... a connection was closed!");
            deleteConnection(conn!.ConnId);
        });
        doHandler("OnConnect", { Conn: conn });
    }

    function SendIntroduction(conn: DataConnectionPlus) {
        Send(conn, { Type: "Introduction", Data: genMyConnection() })
    }

    function genMyConnection(): DataConnectionPlus {
        return NewConnectionObj(_ConnId, _IsLeader, _DisplayName, _PeerConnectionString, Date.now(), null, true, _RoomName, "Introduced", _OrderNumber);
    }

    //<ConnId, ConnectionObj> 
    let _Connections: Map<string, DataConnectionPlus> = new Map();
    function NewConnectionObj(connId: string, isLeader: boolean | null, displayName: string | null, peerConnectionString: string | null, lastMsgDT: number | null, peerConnection: DataConnection | null, active: boolean, room: string | null, status: PeerConnectionStatus = "Unknown", orderNumber: number | undefined = undefined): DataConnectionPlus {
        return {
            ConnId: connId,
            IsLeader: isLeader,
            DisplayName: displayName,
            PeerConnectionString: peerConnectionString,
            LastMsgDT: lastMsgDT,
            PeerConnection: peerConnection,
            Active: active,
            Room: room,
            Status: status,
            OrderNumber: orderNumber
        }
    }

    let _Handlers: Handlers = {
        OnMsg: [],
        OnConnect: [],
        OnDisconnect: [],
        OnConnectionUpdate: [],
        OnCheckIn: [],
        OnStatusChange: [],
        OnPeerConnectionStringSet: [],
        OnLeaderChange: [],
        OnMyLeaderStatusChange: []
    };

    function SetHandler(handlerName: keyof Handlers, functionToCall: HandlerFunction, args: any[], durable: boolean = false): void {
        const handler = { func: functionToCall, args: args, durable: durable };
        if (_Handlers[handlerName]) {
            _Handlers[handlerName].push(handler);
        }
    }

    newPeerNet.SetHandler = SetHandler;
    const debugHandlerMessages = false;
    function doHandler(handlerName: keyof Handlers, ...args: any[]) {
        if (typeof args == 'undefined') {
            args = [];
        }
        for (const waitingCall of _Handlers[handlerName]) {
            if (typeof waitingCall.args == 'undefined') {
                waitingCall.args = [];
            }
            if (debugHandlerMessages) console.log("Calling ", handlerName, " with... ", waitingCall.args, args);
            waitingCall.func(...waitingCall.args, ...args);
        }
        _Handlers[handlerName] = _Handlers[handlerName].filter((waitingCall) => { return waitingCall.durable });
        if (debugHandlerMessages) console.log("Remaining handlers for ", handlerName, _Handlers[handlerName]);
    }

    //Initiate a connection to a new room (Will make API call for list of PeerConnections)  
    function Connect(this: PeerNetObjType, roomName: string, playerName: string) {
        if (!_PeerConnectionString) {
            SetHandler("OnPeerConnectionStringSet", this.Connect, [roomName, playerName]);
            return;
        }
        ResetName(playerName);
        _RoomName = roomName;
        setStatus(2, "RoomName Set")
        SendToOperator({ Type: 'Check-in', PeerConnectionString: _PeerConnectionString })
    }
    newPeerNet.Connect = Connect;

    //Blast everything assicated with this room  
    function Disconnect(roomName: string) {
        throw new Error("Disconnect doesn't do anything yet...")
    }
    newPeerNet.Disconnect = Disconnect;

    //Attempt to send a message to a peer 
    function Send(targetConn: DataConnectionPlus, msg: MsgType) {
        try {
            if (typeof (targetConn.PeerConnection) == undefined || !targetConn.Active) {
                ConnectToPeer(targetConn);
            }
            else {
                targetConn.PeerConnection
                targetConn.PeerConnection?.send(msg);
            }
        }
        catch (e) {
            console.warn("Failed to send message...\n")
            console.warn(e);
        }
    }
    newPeerNet.Send = Send;

    //Update your display name
    function ResetName(newName: string) {
        _DisplayName = newName;
    }
    newPeerNet.ResetName = ResetName;



    function SetOperatorURL(url: string) {
        _OperatorURL = url;
    }
    newPeerNet.SetOperatorURL = SetOperatorURL

    //Returns a list of peer connections
    function GetPeers() {
        return _Connections;
    }
    newPeerNet.GetPeers = GetPeers;

    //Returns a list of peer connections that are active
    function GetActivePeers() {
        if (!_Connections || typeof _Connections == 'undefined') {
            console.warn("_Connections are not set yet. Chill");
            return new Map();
        }
        let retMap: Map<string, DataConnectionPlus> = new Map();
        _Connections.forEach((conn, connId) => {
            if (conn.Active) {
                retMap.set(connId, conn);
            }
        });
        return retMap;
    }
    newPeerNet.GetActivePeers = GetActivePeers;

    function isValidMsg(msg: unknown): msg is MsgType {
        return typeof msg === 'object' && msg !== null && 'Type' in msg;
    }

    //Does stuff when a message is received
    function _HandleMsg(msg: unknown, senderConn: DataConnectionPlus) {
        if (!isValidMsg(msg)) {
            console.error(`Malformed msg:`, msg);
            return;
        }
        if (msg.Type == "Introduction") {
            UpdateConnectionInfo(msg.Data as DataConnectionPlus, senderConn);
            if (_IsLeader) {
                SendConnectionListUpdate();
            }
        }
        else if (msg.Type == "Req-Introduction") {
            SendIntroduction(senderConn);
        }
        else if (msg.Type == "Text") {

        }
        else if (msg.Type == "PeerCheckin") {

        }
        else if (msg.Type == "LeaderCheckin" && senderConn.IsLeader) {

        }
        else if (msg.Type == "UpdatedConnList") {
            if (senderConn.IsLeader) {
                handleConnListUpdate(msg.Data.ConnList);
            }
            else {
                console.warn(`The sender of this update (${senderConn.DisplayName}) does not have the authority to update you conns.`);
            }
        }
        else if (msg.Type == "RequestLeadership") {
            //Might need to check if leader is active
            const nextConn = getTopConnByOrder("Lowest");
            if ((typeof nextConn == 'undefined') || senderConn.ConnId == nextConn.ConnId) {
                approveLeadersip(senderConn)
            }
            else {
                console.warn("Uhh -- someone 'not next' tried to become the leader...", senderConn);
            }
        }
        else if (msg.Type == "ApproveLeadership") {
            if (_assumingLeadership) {
                assumeLeadership();
            }
        }
        else {
            console.warn(`Unhandled Msg type:`, msg, senderConn)
        }
        const internalMessageTypes = ['LeaderCheckin', 'PeerCheckin', 'UpdatedConnList', 'ApproveLeadership', 'RequestLeadership', 'LeaderCheckin', 'PeerCheckin', 'Req-Introduction', 'Introduction'];
        if (!internalMessageTypes.includes(msg.Type)) {
            DoHandleMessageFunc(senderConn, msg);
        }
        doHandler("OnMsg", { Sender: senderConn, Message: msg });
    }

    function approveLeadersip(senderConn: DataConnectionPlus) {
        setConnection(senderConn.ConnId, { ...senderConn, IsLeader: true });
        console.info(senderConn.DisplayName, " is now the leader");
        Send(senderConn, { Type: "ApproveLeadership" });
        _assumingLeadership = false;
        doHandler("OnLeaderChange", { NewLeader: senderConn });
    }

    function assumeLeadership() {
        setRoomLeader(_ConnId);
        SendConnectionListUpdate();
    }

    function handleConnListUpdate(connList: DataConnectionPlus[]) {
        const connIdList = []
        for (const connection of connList) {
            if (connection.ConnId == _ConnId) {
                //Thats you -- Lets not store this. 
                setMyOrderNumber(connection.OrderNumber);
                continue;
            }
            const currentConn = _Connections.has(connection.ConnId) ? _Connections.get(connection.ConnId) : null;
            if (!currentConn) {
                const newConn = NewConnectionObj(connection.ConnId, connection.IsLeader, connection.DisplayName, connection.PeerConnectionString, connection.LastMsgDT, null, false, connection.Room, "Disconnected", connection.OrderNumber);
                setConnection(connection.ConnId, newConn);
            }
            else {
                if (currentConn.OrderNumber != connection.OrderNumber) {
                    const updatedConn: DataConnectionPlus = { ...currentConn, OrderNumber: connection.OrderNumber }
                    setConnection(connection.ConnId, updatedConn);
                }
            }
            connIdList.push(connection.ConnId);
        }
        for (const [connId, conn] of _Connections) {
            //if the connection is inactive and not in the update -- go ahead and blast it. 
            if (!connIdList.includes(connId) && !conn.Active) {
                deleteConnection(connId);
            }
        }
    }

    function SendConnectionListUpdate() {
        setOrderNumbers();
        const connsList = genActivePeersList().filter((conn) => { return conn.Room == _RoomName })
        connsList.push(genMyConnection());
        sendToClients({ Type: "UpdatedConnList", Data: { ConnList: connsList } }, true)
        SendToOperator({ Type: "UpdatedConnList", ConnList: connsList })
    }

    function setMyOrderNumber(num: number | undefined) {
        if (typeof num == 'undefined') {
            console.warn("Yeah, Lets not un-set your OrderNumber", new Error());
            return
        }
        _OrderNumber = num;
    }

    function setOrderNumbers() {
        if (_IsLeader) {
            setMyOrderNumber(0);
        }
        for (const [connId, conn] of _Connections) {
            if ((typeof conn.OrderNumber == 'undefined' || !conn.OrderNumber) && _IsLeader) {
                const highestOrderNumberConn = getTopConnByOrder("Highest")
                //By default, lets assume that there are no numbers set. 
                let highestNumber = 0;
                if (typeof highestOrderNumberConn != 'undefined') {
                    //So we got a connection back from the function, but if by some miracle it's order numnber is unset... then lets just start a new numbering system
                    highestNumber = highestOrderNumberConn.OrderNumber || 1;
                }
                conn.OrderNumber = highestNumber + 1;
                setConnection(connId, conn);
            }
        }
    }

    function genActivePeersList() {
        const activePeers = GetActivePeers();
        const peersList: DataConnectionPlus[] = [...activePeers.values()].map((conn) => {
            return { ...conn, PeerConnection: null };
        });
        return peersList;
    }

    let DoHandleMessageFunc = function (senderConn: DataConnectionPlus, msg: MsgType) { console.warn("Handle Message function is not set") };

    function SetHandleMessage(func: (senderConn: DataConnectionPlus, msg: MsgType) => void) {
        DoHandleMessageFunc = func;
    }
    newPeerNet.SetHandleMessage = SetHandleMessage;

    function UpdateConnectionInfo(infoObj: DataConnectionPlus, senderConn: DataConnectionPlus) {
        if (_Connections.has(senderConn.ConnId)) {
            deleteConnection(senderConn.ConnId);
        }
        setConnection(infoObj.ConnId, NewConnectionObj(infoObj.ConnId, infoObj.IsLeader, infoObj.DisplayName, infoObj.PeerConnectionString, Date.now(), senderConn.PeerConnection, true, infoObj.Room, "Introduced", infoObj.OrderNumber))
    }

    function setConnection(connId: string, conn: DataConnectionPlus) {
        _Connections.set(connId, conn);
        //will send update when an introduction message is received 
        doHandler("OnConnectionUpdate", { ConnId: connId, Conn: conn, Source: "setConnection" });
    }

    function getTopConnByOrder(order: "Highest" | "Lowest") {
        let topNumber = 0;
        if (order == 'Lowest') {
            topNumber = Number.MAX_SAFE_INTEGER;
        }
        let retConn: DataConnectionPlus | undefined;
        for (const [connId, conn] of _Connections) {
            if (typeof conn.OrderNumber !== 'undefined' && ((order == "Highest" && conn.OrderNumber > topNumber) || (order == "Lowest" && conn.OrderNumber < topNumber))) {
                topNumber = conn.OrderNumber;
                retConn = conn;
            }
        }
        if (typeof retConn == 'undefined') {
            return undefined;
        }
        return retConn;
    }

    function deleteConnection(connId: string) {
        _Connections.delete(connId);
        if (_IsLeader) {
            SendConnectionListUpdate();
        }
        doHandler("OnConnectionUpdate", { ConnId: connId, Source: "deleteConnection" });
    }

    //Send a message to the operator API endpoint
    //DO NOT CALL THIS UNLESS YOU HAVE TO
    //Automatically called by 'Leader' on new peerConn or closed peerConn
    async function SendToOperator(msgObj: { Type: string; PeerConnectionString?: string | null; ConnList?: DataConnectionPlus[] | null, Msgs?: any[] }) {
        if (!_operatorThrottle.shouldSend()) {
            _operatorThrottle.enqueue(msgObj);
            _operatorThrottle.delaySendHandle = setTimeout(_operatorThrottle.send, _operatorThrottle.timeLeft());
            return;
        }
        _operatorThrottle.lastMsgToOperatorDT = Date.now();
        let resultObj;
        try {
            const objToSend = { DisplayName: _DisplayName, ConnId: _ConnId, Room: _RoomName, ...msgObj };
            const response = await fetch(_OperatorURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(objToSend),
            });

            resultObj = await response.json();
            HandleMsgFromOperator(resultObj);
        } catch (error) {
            console.error(error);
        }

    }

    function CloseActiveConnections() {
        for (const [conId, connection] of _Connections) {
            if (connection.Active) {
                connection.PeerConnection?.close();
            }
        }
        doHandler("OnConnectionUpdate", { Source: "CloseActiveConnections" });
    }

    //Updates the internal list of peers in the room
    function SetConnections(connectionsList: DataConnectionPlus[]) {
        CloseActiveConnections();
        _Connections = new Map();
        for (const connection of connectionsList) {
            if (connection.ConnId == _ConnId) {
                //Thats you -- Lets not store this. 
                setMyOrderNumber(connection.IsLeader ? 0 : connection.OrderNumber);
                continue;
            }
            let newConn = NewConnectionObj(connection.ConnId, connection.IsLeader, connection.DisplayName, connection.PeerConnectionString, null, null, false, _RoomName, undefined, connection.OrderNumber);
            setConnection(connection.ConnId, newConn);
        }
    }

    function ConnectToPeer(conn: DataConnectionPlus) {
        const PeerConnectionString = conn.PeerConnectionString;
        if (!PeerConnectionString) {
            console.warn("PeerConnectionString null. Abandoning connect attempt.", PeerConnectionString);
            return;
        }
        if (_Connections.has(PeerConnectionString)) {
            console.warn("Connection already exists", conn);
            const targetConn = _Connections.get(PeerConnectionString);
            if (typeof (targetConn?.PeerConnection) == undefined) {
                console.warn("Peer connection is not currently active -- attempting to connect.")
            }
            else {
                return;
            }
        }
        let newConn = _Peer.connect(PeerConnectionString);
        // on open will be launch when you successfully connect to PeerServer
        newConn.on("open", function () {
            handleOutgoingPeerCon(newConn);
        });
        _Peer.on("error", function (err: any) {
            if (err.type == 'peer-unavailable') {
                if (!_Connections.get(conn.ConnId)?.Active) {
                    console.warn(`Peer ${conn.DisplayName} is unavailable @ ${PeerConnectionString}`)
                    HandleFailedToConnect(conn);
                }
            }
            else {
                console.error("!!-PEER ERROR-!!", err);
            }
        })
        return conn;
    }

    //Does stuff when a response from an operator API call is received
    function HandleMsgFromOperator(resultObj: { Type: string; ConnId: string; CurrentCons: DataConnectionPlus[]; IsLeader: boolean; CheckInInterval: any; Error?: string; LeaderIs: DataConnectionPlus | undefined }) {
        const expectedInternalMsgTypesToIgnore = ["UpdatedConnList-Response", "UpdatedConnList-Response", "LeaderKeepAlive-Response"];
        if (resultObj.Type == "checkIn-Response") {
            setStatus(3, "Got Operator CheckIn-Response");
            //Save your _ConnId for later
            _ConnId = resultObj.ConnId;
            SetConnections(resultObj.CurrentCons);
            setRoomLeader(resultObj.CurrentCons.find((conn) => (conn.IsLeader))?.ConnId || "");
            const checkInInterval = resultObj.CheckInInterval;
            if (resultObj.IsLeader) {
                //Congrats, you're the leader
                setOrderNumbers();
                greetClients();
            }
            else {
                //Ahh well, Just a common peasant.
                greetLeader();
            }
            clearInterval(_CheckInIntervalHandle);
            _CheckInIntervalHandle = setInterval(checkIn, checkInInterval);
            doHandler("OnCheckIn", { CheckInResponse: resultObj })
        }
        else if (expectedInternalMsgTypesToIgnore.includes(resultObj.Type)) {
            if (resultObj.Error) {
                if (resultObj.Error == "Who the heck are you?") {
                    if (_ConnId != resultObj.LeaderIs?.ConnId) {
                        if (resultObj && resultObj.LeaderIs) {
                            setRoomLeader(resultObj.LeaderIs.ConnId)
                        }
                    }
                }
                console.error("Error from Operator:", resultObj);
            }
        }
        else {
            console.warn("Unhandled Response from Operator: ", resultObj);
        }
    }

    function checkIn() {
        if (_IsLeader) {
            checkInWithClients();
            checkInWithOperator();
        }
        else {
            checkInWithLeader();
        }
    }

    function checkInWithClients() {
        sendToClients({ Type: "LeaderCheckin" });
    }

    function checkInWithOperator() {
        if (Date.now() > _lastOperatorCheckin + (60 * 1000)) {
            SendToOperator({ Type: "LeaderKeepAlive" });
            _lastOperatorCheckin = Date.now();
        }
    }

    function sendToClients(msgObj: { Type: string, Data?: any }, activeOnly = false) {
        for (const [connId, conn] of _Connections) {
            if (!activeOnly || conn.Active) {
                Send(conn, msgObj);
            }
        }
    }

    function checkInWithLeader() {
        const leaderConn = getLeaderConn();
        if (!leaderConn) {
            return;
        }
        Send(leaderConn, { Type: "PeerCheckin" });
    }

    function greetLeader() {
        const leaderConn = getLeaderConn();
        if (!leaderConn) {
            return;
        }
        ConnectToPeer(leaderConn);
    }

    function greetClients() {
        for (const [connId, conn] of _Connections) {
            ConnectToPeer(conn);
        }
    }

    //Note: What if there are more than one? 
    function getLeaderConn() {
        for (const [connId, conn] of _Connections) {
            if (conn.IsLeader) {
                return conn;
            }
        }
        console.warn("No leader conn found...");
        HandleMissingLeader();

        return;
    }

    function HandleMissingLeader() {
        const nextLeaderConn = getTopConnByOrder("Lowest");
        if (typeof nextLeaderConn == 'undefined') {
            //Nobody is next. So I guess I'll do it. 
            console.log("No next leader defined. Requesting Leadership");
            requestLeadership();
        }
        else if (typeof _OrderNumber != 'undefined' && (typeof nextLeaderConn!.OrderNumber == 'undefined' || (_OrderNumber < nextLeaderConn!.OrderNumber))) {
            console.log("Unknown order of leaders OR I'm next in line for the throne. - Requesting Leadership");
            requestLeadership();
        }
        else {
            Send(nextLeaderConn, { Type: "PeerCheckin" })
        }
    }

    function requestLeadership() {
        if ([...GetPeers().values()].length <= 0) {
            assumeLeadership();
            return;
        }
        sendToAll({ Type: "RequestLeadership" });
        _assumingLeadership = true;
    }

    function sendToAll(msgObj: MsgType) {
        for (const [connId, conn] of GetPeers()) {
            Send(conn, msgObj);
        }
    }

    function setRoomLeader(newLeaderId: string) {
        if (_ConnId == newLeaderId && !_IsLeader) {
            _IsLeader = true;
            console.info("-- ✨You are the leader of this room✨ --");
            doHandler("OnMyLeaderStatusChange", { IsLeader: _IsLeader });
        }
        if (_CurrentLeaderId != newLeaderId) {
            _CurrentLeaderId = newLeaderId;
            doHandler("OnLeaderChange", { newLeaderId: newLeaderId });
        }
    }

    function HandleFailedToConnect(conn: DataConnectionPlus) {
        deleteConnection(conn.ConnId);
        if (conn.IsLeader) {
            console.warn(`Connection: ${conn.ConnId} for ${conn.DisplayName} has been removed. Peer failed to connect`)
            HandleMissingLeader();
        }
    }

    newPeerNet.ForceCheckin = function () {
        SendToOperator({ Type: 'Check-in', PeerConnectionString: _PeerConnectionString })
    }

    newPeerNet._SendMsgToOperator = function (msg) {
        SendToOperator(msg);
    }

    newPeerNet.GetPeerId = function () {
        return _PeerConnectionString;
    }

    newPeerNet.IsLeader = function () {
        return _IsLeader === true;
    }

    newPeerNet.GetOrderNumber = function () {
        return _OrderNumber;
    }

    return newPeerNet;
}