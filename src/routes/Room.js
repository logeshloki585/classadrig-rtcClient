import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 100%;
    flex-wrap: wrap;
    background-color:black;
`;

const VideoContainer = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    width: 90%;
    height: 70vh;
    margin: auto;
    border: 1px solid white;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const SelfVideo = styled.video`
    height: 200px;
    width: 400px;
`;
const FlexVideo = styled.div`
    height: 200px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;


const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", (stream) => {
            ref.current.srcObject = stream;
        });
    }, [peer]);

    return <StyledVideo playsInline autoPlay ref={ref} />;
};

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

    useEffect(() => {
        socketRef.current = io.connect("https://noisy-aleda-adrig0-c5c9a11f.koyeb.app");
        navigator.mediaDevices
            .getUserMedia({ video: videoConstraints, audio: true })
            .then((stream) => {
                userVideo.current.srcObject = stream;
                socketRef.current.emit("join room", roomID);
                socketRef.current.on("all users", (users) => {
                    const peers = [];
                    users.forEach((userID) => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        peersRef.current.push({
                            peerID: userID,
                            peer,
                        });
                        peers.push(peer);
                    });
                    setPeers(peers);
                });

                socketRef.current.on("user joined", (payload) => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    });

                    setPeers((users) => [...users, peer]);
                });

                socketRef.current.on("receiving returned signal", (payload) => {
                    const item = peersRef.current.find((p) => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });
            });

        return () => {
            // Clean up on component unmount
            socketRef.current.disconnect();
            peersRef.current.forEach(({ peer }) => peer.destroy());
        };
    }, [roomID]);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: {
                iceServers: [
                            {
                              url: 'stun:global.stun.twilio.com:3478',
                              urls: 'stun:global.stun.twilio.com:3478'
                            },
                            {
                              url: 'turn:global.turn.twilio.com:3478?transport=udp',
                              username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                              urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                              credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                            },
                            {
                              url: 'turn:global.turn.twilio.com:3478?transport=tcp',
                              username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                              urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
                              credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                            },
                            {
                              url: 'turn:global.turn.twilio.com:443?transport=tcp',
                              username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                              urls: 'turn:global.turn.twilio.com:443?transport=tcp',
                              credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                            }
                          ],
            },
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    {
                      url: 'stun:global.stun.twilio.com:3478',
                      urls: 'stun:global.stun.twilio.com:3478'
                    },
                    {
                      url: 'turn:global.turn.twilio.com:3478?transport=udp',
                      username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                      credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                    },
                    {
                      url: 'turn:global.turn.twilio.com:3478?transport=tcp',
                      username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                      urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
                      credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                    },
                    {
                      url: 'turn:global.turn.twilio.com:443?transport=tcp',
                      username: '0d2193c553b34208a84815fec61c1fb81c39424eaf38e2ac5b3e1abb3349084e',
                      urls: 'turn:global.turn.twilio.com:443?transport=tcp',
                      credential: 'AJD5j8nI5V0aSU3OD9YYBkqogi29b6uTdqzE+jzY+gM='
                    }
                  ],
            },
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container >
            <VideoContainer>
                {peers.map((peer, index) => {
                    return <Video key={index} peer={peer} />;
                })}
            </VideoContainer>
            <FlexVideo>
                <SelfVideo muted ref={userVideo} autoPlay playsInline />
            </FlexVideo>
        </Container>
    );
};

export default Room;
