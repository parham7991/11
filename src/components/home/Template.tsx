import React from 'react';
import Template1 from './Template1';
type Props = {
  story: {
    story:{
      items: {
      link: string;
      title: string;
      image: string;
    }[];
    }
    title: string;
    template_code: string;
  };
};
const Template = ({ story }: Props) => {
  return <>{story.template_code === '1' && <Template1 story={story} />}</>;
};

export default Template;
