import { useContext } from "react";
import { StoreContext } from "../strores/store";

export function useStore () {
    return useContext(StoreContext);
}