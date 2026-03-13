import { darkMap, satelliteMap } from "../constants/maps"

export const getMap = (mode: string) => {
    switch (mode) {
        case "satellite":
            return satelliteMap;
        case "dark":
            return darkMap

    }
}