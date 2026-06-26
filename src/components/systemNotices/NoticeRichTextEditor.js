import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <Box sx={{ minHeight: 220 }} />,
});

export default function NoticeRichTextEditor({ value, onChange }) {
  const theme = useTheme();

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'clean'],
    ],
  }), []);

  const formats = useMemo(() => ([
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'align',
    'link',
  ]), []);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        Use a barra para formatar texto, espaçamento, títulos, listas, cores e links.
      </Typography>
      <Box
        sx={{
          '& .ql-toolbar.ql-snow': {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderColor: alpha(theme.palette.divider, 0.9),
            background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.82),
          },
          '& .ql-container.ql-snow': {
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            borderColor: alpha(theme.palette.divider, 0.9),
            background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.72),
            color: theme.palette.text.primary,
            minHeight: 220,
          },
          '& .ql-editor': {
            minHeight: 180,
            lineHeight: 1.7,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.body1.fontFamily,
            fontSize: theme.typography.body1.fontSize,
          },
          '& .ql-editor.ql-blank::before': {
            color: theme.palette.text.secondary,
            fontStyle: 'normal',
          },
          '& .ql-snow .ql-stroke': {
            stroke: theme.palette.text.secondary,
          },
          '& .ql-snow .ql-fill': {
            fill: theme.palette.text.secondary,
          },
          '& .ql-snow .ql-picker': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder="Digite e formate o conteúdo do aviso..."
        />
      </Box>
    </Box>
  );
}
