"use client";

import { useEffect } from "react";

import { Link as LinkExtension } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Smile,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";

const EMOJIS = [
  "😀", "😄", "😉", "😊", "🙂", "😍", "🤔", "😅",
  "🎉", "🚀", "✅", "⚠️", "❌", "💡", "🔧", "📢",
  "👍", "👏", "🔥", "⭐", "📌", "🛠️", "🐛", "✨",
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Altura da área de edição — o editor rola internamente ao ultrapassar esse limite, em vez de esticar a página. */
  minHeightClassName?: string;
}

/**
 * Editor WYSIWYG genérico e reutilizável (Tiptap/ProseMirror). Não há
 * nenhuma solução de rich text já instalada no projeto — validado antes de
 * adicionar esta dependência.
 *
 * Formatação intencionalmente limitada ao que foi pedido (negrito, itálico,
 * listas, link, emoji) — StarterKit traz bem mais recursos, mas só expomos
 * esses na toolbar para manter a experiência simples.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-[220px]",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Escreva o conteúdo...",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Mantém o editor sincronizado quando o `value` externo muda (ex: ao
  // abrir o form em modo de edição, depois do editor já ter sido criado).
  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;

    editor.commands.setContent(value || "", { emitUpdate: false });
     
  }, [value, editor]);

  if (!editor) return null;

  function handleLink() {
    const urlAtual = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", urlAtual ?? "https://");

    if (url === null) return;

    if (url === "") {
      editor?.chain().focus().unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrito"
        >
          <Bold className="size-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Itálico"
        >
          <Italic className="size-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Lista"
        >
          <List className="size-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Lista numerada"
        >
          <ListOrdered className="size-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={handleLink}
          aria-label="Link"
        >
          <Link2 className="size-4" />
        </Toggle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-8">
              <Smile className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="grid grid-cols-8 gap-1 p-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => editor.chain().focus().insertContent(emoji).run()}
                className="rounded p-1 text-lg hover:bg-accent"
              >
                {emoji}
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rola internamente ao ultrapassar a altura — a página e os botões
          de ação do formulário nunca ficam fora da área visível por causa
          de um texto grande. */}
      <div className={`${minHeightClassName} max-h-[420px] overflow-y-auto`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
