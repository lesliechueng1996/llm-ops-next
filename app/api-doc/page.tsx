import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './_components/ReactSwagger';

const page = async () => {
  const spec = await getApiDocs();
  return <ReactSwagger spec={spec} />;
};

export default page;
