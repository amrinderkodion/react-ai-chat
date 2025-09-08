export function handlePaste(
    event: React.ClipboardEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>
) {
    const newFiles: File[] = [];
    const items = event.clipboardData.items;

    for (const item of items) {
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                newFiles.push(file);
            }
        }
    }

    if (newFiles.length > 0) {
        setFiles((prevFiles: File[]) => [...prevFiles, ...newFiles]);
        event.preventDefault();
    }
}

export function handleRemoveFile(
    fileToRemove: File,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>
) {
    setFiles((prevFiles: File[]) => prevFiles.filter((file) => file !== fileToRemove));
}

export function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFiles: (files: File[]) => void
) {
    if (e.target.files) {
        setFiles(Array.from(e.target.files));
    }
}