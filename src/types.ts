// types.ts
export type Msg = { sender: 'assistant' | 'user'; text: string; t?: number };
export type Session = {
    id: string;
    title: string;
    createdAt: number;
    messages: Msg[];
    notes?: string;
};