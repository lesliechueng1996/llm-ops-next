/**
 * 登录页面组件
 *
 * 一个现代化的登录页面，包含轮播展示区和登录表单。
 * 左侧为产品特性轮播展示，右侧为登录表单。
 *
 * @component
 * @returns {JSX.Element} 返回一个包含轮播展示和登录表单的页面组件
 *
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 */
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import LoginForm from './_components/LoginForm';

// 轮播展示数据配置
const carousels = [
  {
    id: 1,
    title: '开箱即用的高质量AI编排模版',
    subTitle: '丰富的应用组件、覆盖大多数典型业务场景',
    image: '/images/login-banner.png',
  },
  {
    id: 2,
    title: '零代码5分钟编排原生AI应用',
    subTitle: '高效开发你的AI原生应用',
    image: '/images/login-banner.png',
  },
];

const LoginPage = () => {
  return (
    <div className="h-screen w-screen flex">
      {/* 左侧轮播展示区 */}
      <div className="w-1/3 bg-gradient-to-b from-blue-950 to-blue-900">
        <Carousel
          opts={{
            loop: true, // 启用循环播放
          }}
        >
          <CarouselContent>
            {carousels.map((carousel) => (
              <CarouselItem
                key={carousel.id}
                className="flex justify-center items-center h-screen"
              >
                <div className="text-center">
                  <h1 className="text-white text-2xl font-bold mb-2">
                    {carousel.title}
                  </h1>
                  <h2 className="text-sm text-muted-foreground mb-8">
                    {carousel.subTitle}
                  </h2>
                  <div className="w-2/3 mx-auto">
                    <img
                      src={carousel.image}
                      alt={carousel.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* 轮播控制按钮 */}
          <CarouselPrevious className="left-4 bg-white/10 text-white" />
          <CarouselNext className="right-4 bg-white/10 text-white" />
        </Carousel>
      </div>
      {/* 右侧登录表单区 */}
      <div className="w-2/3 flex justify-center items-center">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
