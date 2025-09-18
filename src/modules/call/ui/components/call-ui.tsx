import { StreamTheme, useCall} from "@stream-io/video-react-sdk";
import {useState} from "react";
import {CallLobby} from "@/modules/call/ui/components/call-lobby";
import {CallActive} from "@/modules/call/ui/components/call-active";
import {CallEnded} from "@/modules/call/ui/components/call-ended";

interface Props {
    meetingName:string;
}

export const CallUI = ({ meetingName }:Props) => {
    const call = useCall();
    const [show, setShow] = useState<"lobby" | "call" | "ended" >("lobby");

    const handleJoin = async () => {
        if(!call) return;
        await call.join();
        setShow("call");
    }
    const handleLeave = () => {
        if(!call) return;
        call.endCall();
        setShow("ended");
    }
    return (
        <StreamTheme className={'h-full'}>
            {show === "lobby" && <CallLobby onJoin={handleJoin}/>}
            {show === "call" && <CallActive onLeave={handleLeave} meetingName={meetingName}/>}
            {show === "ended" && <CallEnded/>}
        </StreamTheme>
    )
}
