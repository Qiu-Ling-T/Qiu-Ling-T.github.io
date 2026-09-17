'use strict';

// 生成 /search.json 供前端搜索使用
hexo.extend.generator.register('anime-search', function (locals) {
  const posts = locals.posts.filter((p) => p.published).sort('-date').map((p) => {
    const html = p.content || '';
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return {
      title: p.title || '',
      url: p.path,
      date: p.date ? p.date.toISOString().slice(0, 10) : '',
      tags: p.tags && p.tags.data ? p.tags.data.map((t) => t.name) : [],
      content: text.slice(0, 500)
    };
  });
  return {
    path: 'search.json',
    data: JSON.stringify({ posts })
  };
});
