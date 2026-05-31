import React from "react";
import "@arco-themes/react-easy-email-pro/css/arco.css";

import { PageLayout } from "@/components/PageLayout";
import styles from "./index.module.less";

const features = [
  {
    subject: "Full feature",
    description:
      "Explore the complete editor surface with production-ready tools.",
    details:
      "Use this as the reference for the full SDK experience: block library, design controls, previews, export, asset handling, and production editor flows.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/usg1dnyf24pjrcap5itlo_full-feature.png",
    url: "/full",
    badge: "Complete",
  },
  {
    subject: "Block Studio",
    description: "Visually compose reusable Widget Elements without code.",
    details:
      "Build reusable widgets, expose the fields editors can safely change, and publish the block back into the editor for drag-and-drop use.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/tuokv76kw_zvlgxa6q9dx_studio.png",
    url: "/studio",
    badge: "Recommended",
  },
  {
    subject: "Responsive view",
    description: "Compare desktop and mobile layouts while editing.",
    details:
      "Reference how teams review responsive behavior before sending, with fast switching between desktop and mobile layouts.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/vzdj5fk4dmqmae3knnozy_responsive.png",
    url: "/responsive-view",
    badge: "Responsive",
  },
  {
    subject: "Dynamic custom block",
    description:
      "Show live data and business rules inside purpose-built blocks.",
    details:
      "Use this example when your product needs order summaries, product recommendations, customer-specific content, or other dynamic modules.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/lzcxu8nghdbpui9sk33yo_dynamic-block.png",
    url: "/dynamic-custom-block",
    badge: "Advanced",
  },
  {
    subject: "Universal elements",
    description:
      "Save shared headers, footers, and snippets for reuse everywhere.",
    details:
      "Turn repeated email sections into maintained building blocks so teams avoid copy-paste drift across campaigns and templates.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/h2lmh88melbigs0cm2ejq_universal.png",
    url: "/universal-element",
    badge: "Reusable",
  },
  {
    subject: "Modern",
    description: "A focused editing workspace for everyday marketing teams.",
    details:
      "A cleaner editor experience for users who need to update campaign content without seeing every advanced control.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/v0w5hkqhieisbco8dizqd_modern.png",
    url: "/modern",
    badge: "Role-based",
  },
  {
    subject: "ReadOnly Mode",
    description:
      "Lock structure while letting users edit approved content fields.",
    details:
      "Ideal for customer-facing editing where your app owns the template structure and users only adjust safe fields, links, images, and copy.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/mtam0a_ozc7-y4vvfljvu_readonly.png",
    url: "/read-only",
    badge: "Safe editing",
  },
  {
    subject: "AMP",
    description:
      "Try interactive email blocks such as forms, products, and wheels.",
    details:
      "Explore AMP-ready interaction patterns for supported inboxes, with fallback thinking for clients that render standard HTML.",
    thumbnail:
      "https://cdn.shopify.com/s/files/1/0863/8971/9346/files/tlk0ingv9kuw4c0qahhdc_amp.png",
    url: "/amp-email",
    badge: "Interactive",
  },
];

export const Home = () => {
  return (
    <PageLayout>
      <div className={styles.page}>
        <main className={styles.content}>
          <div className={styles.header}>
            <div className={styles.eyebrow}>Demo Gallery</div>
            <h1 className={styles.title}>Explore feature examples</h1>
            <p className={styles.subtitle}>
              Pick a feature example, review what it demonstrates, then open the
              editor to see the workflow in action.
            </p>
          </div>

          <div className={styles.featureList}>
            {features.map((item) => (
              <section key={item.url} className={styles.featureCard}>
                <div className={styles.featureCopy}>
                  <div className={styles.badge}>{item.badge}</div>
                  <h2 className={styles.featureTitle}>{item.subject}</h2>
                  <p className={styles.featureDescription}>
                    {item.description}
                  </p>
                  <p className={styles.featureDescription}>{item.details}</p>
                  <div className={styles.featureActions}>
                    <a className={styles.primaryAction} href={item.url}>
                      Open demo
                    </a>
                    <a
                      className={styles.secondaryAction}
                      href="https://www.easyemail.pro/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View website
                    </a>
                  </div>
                </div>
                <a className={styles.imageFrame} href={item.url}>
                  <img
                    className={styles.featureImage}
                    src={item.thumbnail}
                    alt={`${item.subject} demo preview`}
                  />
                </a>
              </section>
            ))}
          </div>
        </main>
      </div>
    </PageLayout>
  );
};
