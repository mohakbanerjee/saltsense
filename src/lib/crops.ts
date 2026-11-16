/** Add a crop in one place — SaltSense crop catalog + salt / Kc hooks. */
import { EVIDENCE } from "./evidence";

export type CropId =
  | "date_palm"
  | "tomato"
  | "cucumber"
  | "alfalfa"
  | "lettuce";

export type CropStage = "initial" | "mid" | "late";

export type Crop = {
  id: CropId;
  nameEn: string;
  nameAr: string;
  icon: string;
  /** Mid-season Kc evidence id */
  kcEvidenceId: string;
  eceThresholdEvidenceId: string;
  slopeEvidenceId: string;
  rootDepthEvidenceId: string;
  /** Liters per plant for habit default when plant-based */
  habitLitersPerPlant: number;
  /** Plant spacing / canopy area (m²) for converting mm ↔ liters */
  canopyM2: number;
  usesPlants: boolean;
};

export const CROPS: Record<CropId, Crop> = {
  date_palm: {
    id: "date_palm",
    nameEn: "Date palm",
    nameAr: "نخيل التمر",
    icon: "🌴",
    kcEvidenceId: "fao56-kc-date-palm-mid",
    eceThresholdEvidenceId: "fao29-date-palm-ece",
    slopeEvidenceId: "fao29-date-palm-slope",
    rootDepthEvidenceId: "soil-root-depth-palm",
    habitLitersPerPlant: 60,
    /** Irrigated basin per palm (m²) — sized so FAO demand+LR is under common 60 L habit */
    canopyM2: 7,
    usesPlants: true,
  },
  tomato: {
    id: "tomato",
    nameEn: "Tomato",
    nameAr: "طماطم",
    icon: "🍅",
    kcEvidenceId: "fao56-kc-tomato-mid",
    eceThresholdEvidenceId: "fao29-tomato-ece",
    slopeEvidenceId: "fao29-tomato-slope",
    rootDepthEvidenceId: "soil-root-depth-veg",
    habitLitersPerPlant: 4,
    canopyM2: 0.25,
    usesPlants: true,
  },
  cucumber: {
    id: "cucumber",
    nameEn: "Cucumber",
    nameAr: "خيار",
    icon: "🥒",
    kcEvidenceId: "fao56-kc-cucumber-mid",
    eceThresholdEvidenceId: "fao29-cucumber-ece",
    slopeEvidenceId: "fao29-cucumber-slope",
    rootDepthEvidenceId: "soil-root-depth-veg",
    habitLitersPerPlant: 3.5,
    canopyM2: 0.3,
    usesPlants: true,
  },
  alfalfa: {
    id: "alfalfa",
    nameEn: "Alfalfa / fodder",
    nameAr: "برسيم / علف",
    icon: "🌿",
    kcEvidenceId: "fao56-kc-alfalfa-mid",
    eceThresholdEvidenceId: "fao29-alfalfa-ece",
    slopeEvidenceId: "fao29-alfalfa-slope",
    rootDepthEvidenceId: "soil-root-depth-veg",
    habitLitersPerPlant: 0,
    canopyM2: 1,
    usesPlants: false,
  },
  lettuce: {
    id: "lettuce",
    nameEn: "Lettuce",
    nameAr: "خس",
    icon: "🥬",
    kcEvidenceId: "fao56-kc-lettuce-mid",
    eceThresholdEvidenceId: "fao29-lettuce-ece",
    slopeEvidenceId: "fao29-lettuce-slope",
    rootDepthEvidenceId: "soil-root-depth-veg",
    habitLitersPerPlant: 1.5,
    canopyM2: 0.15,
    usesPlants: true,
  },
};

export function listCrops(): Crop[] {
  return Object.values(CROPS);
}

export function getCrop(id: CropId): Crop {
  return CROPS[id];
}

export function cropKc(id: CropId, _stage: CropStage = "mid"): number {
  const crop = getCrop(id);
  return EVIDENCE[crop.kcEvidenceId].value;
}

export function cropEceThreshold(id: CropId): number {
  return EVIDENCE[getCrop(id).eceThresholdEvidenceId].value;
}

export function cropSlope(id: CropId): number {
  return EVIDENCE[getCrop(id).slopeEvidenceId].value;
}

export function cropRootDepthM(id: CropId): number {
  return EVIDENCE[getCrop(id).rootDepthEvidenceId].value;
}
