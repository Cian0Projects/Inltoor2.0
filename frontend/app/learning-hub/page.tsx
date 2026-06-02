import RealWorldExamplesHub from '@/app/components/RealWorldExamplesHub';

export const metadata = {
  title: 'Learning Hub | Inltoor',
  description: 'Explore real-world beam applications and design challenges',
};

export const revalidate = 0; // Disable static caching during development

export default function LearningHubPage() {
  return <RealWorldExamplesHub />;
}
