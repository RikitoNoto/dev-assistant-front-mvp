import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

// A simple Markdown renderer
// In a real application, you would use a library like react-markdown
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Convert markdown to HTML (this is a very simple implementation)
  const renderMarkdown = () => {
    let html = content;
    
    // Convert headers
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold my-3">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
    
    // Convert lists
    html = html.replace(/^\- (.*?)$/gm, '<li class="ml-5">$1</li>');
    html = html.replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-5">$2</li>');
    
    // Wrap adjacent list items in <ul> or <ol>
    html = html.replace(/(<li class="ml-5">.*?<\/li>)\n(<li class="ml-5">)/g, '$1\n$2');
    html = html.replace(/(?:^|\n)(<li class="ml-5">.*?<\/li>)(?:\n|$)/g, '\n<ul class="list-disc my-2">$1</ul>\n');
    
    // Convert paragraphs (any line that doesn't start with a special character)
    html = html.replace(/^([^<#\-\d].+?)$/gm, '<p class="my-2">$1</p>');
    
    // Convert bold and italic text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return html;
  };

  return (
    <div className="prose max-w-none">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown() }} />
    </div>
  );
};

export default MarkdownRenderer;