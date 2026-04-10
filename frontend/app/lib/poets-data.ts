export type PoetGroup = "Classical" | "Modern" | "Women" | "Contemporary";

export type Poet = {
  id: string;
  name: string;
  years: string;
  location: string;
  avatarUrl: string;
  heroImage: string;
  group: PoetGroup[];
  shortBio: string;
  signatureLine: string;
  stats: {
    sher: number;
    ghazal: number;
    nazm: number;
  };
};

const createAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=ffffff&bold=true&size=128`;

const createHeroImage = (name: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(name)}/1200/850`;

export const POETS: Poet[] = [
  {
    id: "mir",
    name: "Mir Taqi Mir",
    years: "1723 - 1810",
    location: "Delhi",
    avatarUrl: createAvatarUrl("Mir Taqi Mir"),
    heroImage: createHeroImage("Mir Taqi Mir"),
    group: ["Classical"],
    shortBio: "The foundational voice of Urdu ghazal, known for emotional clarity and lyrical grace.",
    signatureLine: "Patta patta boota boota haal hamara jaane hai",
    stats: { sher: 112, ghazal: 81, nazm: 12 },
  },
  {
    id: "ghalib",
    name: "Mirza Ghalib",
    years: "1797 - 1869",
    location: "Delhi",
    avatarUrl: createAvatarUrl("Mirza Ghalib"),
    heroImage: createHeroImage("Mirza Ghalib"),
    group: ["Classical", "Modern"],
    shortBio: "A timeless master whose verse combines intellect, irony, and philosophical tenderness.",
    signatureLine: "Hazaron khwahishen aisi ke har khwahish pe dam nikle",
    stats: { sher: 136, ghazal: 94, nazm: 9 },
  },
  {
    id: "faiz",
    name: "Faiz Ahmed Faiz",
    years: "1911 - 1984",
    location: "Lahore",
    avatarUrl: createAvatarUrl("Faiz Ahmed Faiz"),
    heroImage: createHeroImage("Faiz Ahmed Faiz"),
    group: ["Modern"],
    shortBio: "A progressive poet whose language of love and resistance still resonates deeply.",
    signatureLine: "Bol ke lab azaad hain tere",
    stats: { sher: 86, ghazal: 57, nazm: 31 },
  },
  {
    id: "parveen",
    name: "Parveen Shakir",
    years: "1952 - 1994",
    location: "Karachi",
    avatarUrl: createAvatarUrl("Parveen Shakir"),
    heroImage: createHeroImage("Parveen Shakir"),
    group: ["Women", "Modern"],
    shortBio: "A defining feminine voice in Urdu poetry with intimacy, elegance, and contemporary tone.",
    signatureLine: "Khushbu jaise log mile afsane mein",
    stats: { sher: 63, ghazal: 42, nazm: 21 },
  },
  {
    id: "jaun",
    name: "Jaun Eliya",
    years: "1931 - 2002",
    location: "Karachi",
    avatarUrl: createAvatarUrl("Jaun Eliya"),
    heroImage: createHeroImage("Jaun Eliya"),
    group: ["Modern", "Contemporary"],
    shortBio: "Beloved for his existential intensity, conversational rhythm, and sharp reflective style.",
    signatureLine: "Shayad mujhe kisi se mohabbat nahin hui",
    stats: { sher: 99, ghazal: 64, nazm: 26 },
  },
  {
    id: "ada",
    name: "Ada Jafri",
    years: "1924 - 2015",
    location: "Karachi",
    avatarUrl: createAvatarUrl("Ada Jafri"),
    heroImage: createHeroImage("Ada Jafri"),
    group: ["Women", "Modern"],
    shortBio: "A pioneering woman poet who introduced a gentle yet assertive lyrical identity.",
    signatureLine: "Jinhen main dhoondti thi woh nazar ke saamne the",
    stats: { sher: 41, ghazal: 33, nazm: 17 },
  },
  {
    id: "nida",
    name: "Nida Fazli",
    years: "1938 - 2016",
    location: "Mumbai",
    avatarUrl: createAvatarUrl("Nida Fazli"),
    heroImage: createHeroImage("Nida Fazli"),
    group: ["Modern"],
    shortBio: "Known for simplicity and depth, with poems that blend urban realism and inward thought.",
    signatureLine: "Ghar se masjid hai bahut door chalo yun kar lein",
    stats: { sher: 54, ghazal: 39, nazm: 24 },
  },
  {
    id: "wasi",
    name: "Wasi Shah",
    years: "1976 -",
    location: "Lahore",
    avatarUrl: createAvatarUrl("Wasi Shah"),
    heroImage: createHeroImage("Wasi Shah"),
    group: ["Contemporary"],
    shortBio: "A widely-read contemporary poet with accessible language and emotional clarity.",
    signatureLine: "Tum mere paas raho",
    stats: { sher: 29, ghazal: 17, nazm: 14 },
  },
];

export function getPoetById(id: string): Poet | undefined {
  return POETS.find((poet) => poet.id === id);
}
