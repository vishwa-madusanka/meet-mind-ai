import "@stream-io/video-react-sdk/dist/css/styles.css"
import {
    DefaultVideoPlaceholder,
    StreamVideoParticipant, ToggleAudioPreviewButton, ToggleVideoPreviewButton,
    useCallStateHooks,
    VideoPreview
} from "@stream-io/video-react-sdk";
import {authClient} from "@/lib/auth-client";
import {generateAvatarUri} from "@/lib/avatar";
import {Button} from "@/components/ui/button";
import {LogInIcon} from "lucide-react";
import Link from "next/link";
interface Props {
    onJoin: () => void;
}

const DisabledVideoPreview = () => {
    const {data} = authClient.useSession();

    return(
        <DefaultVideoPlaceholder
            participant={
            {
                name: data?.user.name ?? "",
                image: data?.user.image ??
                    generateAvatarUri({
                        seed: data?.user.name ?? "",
                        variant: "initials",
                    }),
            }as StreamVideoParticipant
            }
        />
    )
}

const AllowBrowserPermissions = () => {
    return(
        <p className={'text-sm'}>
            Please Grant Camera and Microphone Permissions to Join the Call
        </p>
    )
}

export const CallLobby = ({ onJoin }: Props) => {
    const {useCameraState, useMicrophoneState} = useCallStateHooks();
    const {hasBrowserPermission: hasCameraPermission} = useCameraState;
    const {hasBrowserPermission: hasMicrophonePermission} = useMicrophoneState;

    const hasBrowserPermission = hasCameraPermission && hasMicrophonePermission;

    return(
        <div className={'flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar'}>
            <div className={'py-4 px-8 flex flex-1 items-center justify-center'}>
                <div className={'flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm'}>
                    <div className={'flex flex-col gap-y-2 text-center'}>
                        <h6 className={'text-lg font-medium'}>Ready To Join</h6>
                        <p className={'text-sm'}>Setup your call before Joining</p>
                    </div>
                    <VideoPreview DisabledVideoPreview={
                        hasBrowserPermission ? DisabledVideoPreview :AllowBrowserPermissions
                    }
                    />
                    <div className={'flex gap-x-2'}>
                        <ToggleAudioPreviewButton />
                        <ToggleVideoPreviewButton />
                    </div>
                    <div className={'flex gap-x-2 justify-between w-full'}>
                        <Button asChild variant={"ghost"}>
                            <Link href={'/meetings'}>
                                Cancel
                            </Link>
                        </Button>
                        <Button onClick={onJoin}>
                            <LogInIcon />
                            Join Call
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}