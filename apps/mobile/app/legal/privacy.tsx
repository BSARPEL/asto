import { ScrollView, StyleSheet } from 'react-native';
import { Body, Screen, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Title>Gizlilik politikası</Title>
        <Body muted>
          Asto; e-posta, doğum bilgileri ve uygulama içi kullanım verilerini hizmeti sunmak için
          işler. Doğum verilerin harita hesaplama ve kişiselleştirilmiş yorum üretmek amacıyla
          kullanılır. Ödeme işlemleri App Store / Google Play ve RevenueCat üzerinden yürür; kart
          bilgileri Asto sunucularında saklanmaz.
        </Body>
        <Body muted>
          Verilerini silmek veya dışa aktarmak için destek kanalımızdan talep edebilirsin. Bu metin
          yer tutucudur; mağaza yayını öncesi hukuki metinle değiştirilmelidir.
        </Body>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, gap: spacing.md },
});
