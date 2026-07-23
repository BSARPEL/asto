import { Body, Screen, ScreenScroll, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ gap: spacing.md }}>
        <Title>Gizlilik politikası</Title>
        <Body muted>
          BN Astro; e-posta, doğum bilgileri ve uygulama içi kullanım verilerini hizmeti sunmak
          için işler. Doğum verilerin harita hesaplama ve kişiselleştirilmiş yorum üretmek
          amacıyla kullanılır. Ödeme işlemleri App Store / Google Play üzerinden yürür; kart
          bilgileri BN Astro sunucularında saklanmaz.
        </Body>
        <Body muted>
          Verilerinizi silmek veya hesabınızı kapatmak için uygulama içinden veya destek
          kanalından talep edebilirsiniz. Bu metin yer tutucudur; yayın öncesi güncellenmelidir.
        </Body>
      </ScreenScroll>
    </Screen>
  );
}
