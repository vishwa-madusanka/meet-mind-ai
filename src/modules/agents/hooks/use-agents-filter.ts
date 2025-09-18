import {parseAsInteger, parseAsString, useQueryStates} from "nuqs";
import {DEFAULT_PAGE} from "@/constants";

export const UseAgentsFilter = () => {
    return useQueryStates({
        search: parseAsString.withDefault("").withOptions({clearOnDefault: true}),
        page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({clearOnDefault: true}),

    })
};
