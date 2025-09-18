 import {SignInView} from "@/modules/auth/ui/views/sign-in-view";
 import {headers} from "next/headers";
 import {auth} from "@/lib/auth";
 import {redirect} from "next/navigation";

const Page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if(!!session) {
        redirect('/')
    }
    console.log('Sign in Page');
    return (
        <SignInView />
    );
}

export default Page
 