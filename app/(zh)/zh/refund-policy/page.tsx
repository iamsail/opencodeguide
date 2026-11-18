import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "退款政策",
  description:
    "OpenCode Guide 课程退款政策：7 天无理由退款、预售课程规则、申请流程与到账时间。",
  alternates: {
    canonical: "/zh/refund-policy",
    languages: {
      "zh-CN": "/zh/refund-policy",
      en: "/refund-policy",
    },
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">退款政策</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="lead">最后更新：2026 年 11 月 18 日</p>

        <p>
          我们希望你可以放心购买。所有课程都提供 <strong>7 天无理由退款</strong>。本页说明具体规则，包括预售课程如何处理。
        </p>

        <h2>一、常规课程</h2>
        <p>
          购买后 <strong>7 天内</strong>可无理由申请全额退款。用下单时的邮箱联系我们并提供订单信息即可，不需要填表，也不需要说明理由。
        </p>

        <h2>二、预售课程</h2>
        <p>
          正式上线前售卖的课程，7 天退款期从<strong>正式上线日</strong>开始计算，而不是付款日。如果上线时间比课程页标注的日期延迟超过 30 天，你可以随时申请全额退款。
        </p>

        <h2>三、全站通（All-Access）</h2>
        <p>
          全站通同样适用 7 天退款期。退款后，包含的全部课程访问权限会被收回。如果你是「先买单课、后补差价升级」，退款金额以实际支付的升级金额为准。
        </p>

        <h2>四、1:1 诊断服务</h2>
        <p>
          Pro 版包含的 1:1 诊断，在<strong>尚未使用</strong>的情况下可全额退款；服务一旦完成，该部分费用不退，仅退剩余课程费用。
        </p>

        <h2>五、如何申请</h2>
        <ol>
          <li>
            通过<Link href="/contact">联系页面</Link>，使用下单邮箱发邮件给我们。
          </li>
          <li>提供订单邮箱，以及 Stripe 收据编号（如有）。</li>
          <li>我们会在 1 个工作日内确认，并在 Stripe 中发起退款。</li>
          <li>
            到账时间通常为 5-10 个工作日，取决于发卡行；汇率差与银行手续费不在我们的控制范围内。
          </li>
        </ol>

        <h2>六、超过 7 天怎么办</h2>
        <p>
          超过 7 天我们不再提供退款，但仍然希望你获得价值：如果课程内容有错误、或者没有覆盖页面承诺的内容，请联系我们，我们会修正内容或协商其他解决方案。
        </p>

        <h2>七、拒付（Chargeback）</h2>
        <p>
          发起拒付前请先联系我们，绝大多数问题可以更快解决。恶意拒付可能导致课程访问权限被收回。
        </p>

        <h2>八、联系方式</h2>
        <p>
          对本政策有疑问？<Link href="/contact">联系我们</Link>，通常 1 个工作日内回复。
        </p>
      </div>
    </div>
  );
}
