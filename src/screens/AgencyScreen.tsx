import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { supabase } from '../lib/supabaseClient';
import type { AgencyScreenProps } from '../types/navigation';
import OptimizedPropertyCard from '../components/OptimizedPropertyCard';
import type { Property } from '../contexts/PropertyContext';
import { Logger } from '../utils/logger';

interface AgencyProfile {
  id: string;
  name: string | null;
  phone: string | null;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  email?: string | null;
  address?: string | null;
}

const AgencyScreen = ({ route, navigation }: AgencyScreenProps) => {
  const { agencyId } = route.params;
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;

  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propsLoading, setPropsLoading] = useState<boolean>(false);

  const sanitizeUrl = (url?: string | null) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  useEffect(() => {
    const loadAgency = async () => {
      try {
        setLoading(true);
        // 1) Пытаемся найти профиль агентства по первичному ключу id
        let { data, error } = await supabase
          .from('agency_profiles')
          .select('*')
          .eq('id', agencyId)
          .single();

        // Если 0 строк (PGRST116) или data пустая — пробуем фолбек по user_id
        if ((error && (error as any)?.code === 'PGRST116') || !data) {
          const fb = await supabase
            .from('agency_profiles')
            .select('*')
            .eq('user_id', agencyId)
            .single();
          data = fb.data as any;
          error = fb.error as any;
        }

        if (error) {
          Logger.warn('Не удалось загрузить профиль агентства:', error);
          setAgency(null);
        } else {
          Logger.debug('Agency profile loaded:', data);
          setAgency(data as AgencyProfile);
        }
      } catch (e) {
        Logger.error('Ошибка загрузки агентства:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAgency();
  }, [agencyId]);

  // Загрузка объявлений агентства
  useEffect(() => {
    const loadAgencyProperties = async () => {
      const targetId = agency?.id || agencyId; // предпочитаем фактический id профиля
      if (!targetId) return;
      try {
        setPropsLoading(true);
        let { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            user:users(name, phone, is_agency),
            city:cities(name),
            agency:agency_profiles(id, name, phone, logo_url, description)
          `)
          .eq('agency_id', targetId)
          .order('created_at', { ascending: false });
        if (error) throw error;

        // Если по agency_id пусто — пробуем фолбек по user_id (случай, когда route получил users.id)
        if (!data || data.length === 0) {
          const fb = await supabase
            .from('properties')
            .select(`
              *,
              user:users(name, phone, is_agency),
              city:cities(name),
              agency:agency_profiles(id, name, phone, logo_url, description)
            `)
            .eq('user_id', targetId)
            .order('created_at', { ascending: false });
          data = fb.data as any;
        }

        setProperties((data || []) as Property[]);
      } catch (e) {
        Logger.error('Ошибка загрузки объявлений агентства:', e);
      } finally {
        setPropsLoading(false);
      }
    };
    loadAgencyProperties();
  }, [agencyId, agency?.id]);

  // Нормализуем возможные альтернативные имена полей из БД (всегда в скоупе)
  const websiteNorm = agency?.website || (agency as any)?.site || (agency as any)?.site_url || null;
  const instagramNorm = agency?.instagram || (agency as any)?.instagram_url || null;
  const facebookNorm = agency?.facebook || (agency as any)?.facebook_url || null;
  const emailNorm = agency?.email || (agency as any)?.mail || (agency as any)?.contact_email || null;
  const addressNorm = agency?.address || (agency as any)?.addr || (agency as any)?.location || null;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!agency) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('common.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>        
        {agency.logo_url ? (
          <Image source={{ uri: agency.logo_url }} style={styles.logo} resizeMode="contain" />
        ) : null}

        {agency.name ? (
          <Text style={[styles.title, { color: theme.text }]}>{agency.name}</Text>
        ) : null}

        {agency.description ? (
          <Text style={[styles.description, { color: theme.text }]}>{agency.description}</Text>
        ) : null}

        {/* Адрес, если есть */}
        {addressNorm ? (
          <Text style={[styles.description, { color: theme.secondary, marginTop: 6 }]}>{addressNorm}</Text>
        ) : null}

        {/* Контакты */}
        <View style={styles.section}>
          {agency.phone ? (
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => Linking.openURL(`tel:${agency.phone}`)}>
              <Text style={styles.buttonText}>{t('agency.call')}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Email */}
          {emailNorm ? (
            <TouchableOpacity style={[styles.linkButton, { borderColor: theme.primary }]} onPress={() => Linking.openURL(`mailto:${emailNorm}`)}>
              <Text style={[styles.linkText, { color: theme.primary }]}>{t('agency.email')}</Text>
            </TouchableOpacity>
          ) : null}

          {websiteNorm ? (
            <TouchableOpacity style={[styles.linkButton, { borderColor: theme.primary }]} onPress={() => Linking.openURL(sanitizeUrl(websiteNorm))}>
              <Text style={[styles.linkText, { color: theme.primary }]}>{t('agency.website')}</Text>
            </TouchableOpacity>
          ) : null}

          {instagramNorm ? (
            <TouchableOpacity style={[styles.linkButton, { borderColor: theme.primary }]} onPress={() => Linking.openURL(sanitizeUrl(instagramNorm))}>
              <Text style={[styles.linkText, { color: theme.primary }]}>{t('agency.instagram')}</Text>
            </TouchableOpacity>
          ) : null}

          {facebookNorm ? (
            <TouchableOpacity style={[styles.linkButton, { borderColor: theme.primary }]} onPress={() => Linking.openURL(sanitizeUrl(facebookNorm))}>
              <Text style={[styles.linkText, { color: theme.primary }]}>{t('agency.facebook')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Список объявлений агентства */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {propsLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          properties.map((p) => (
            <OptimizedPropertyCard
              key={p.id}
              property={p}
              darkMode={darkMode}
              onPress={() => navigation.navigate('PropertyDetails', { propertyId: p.id })}
            />
          ))
        )}
        {!propsLoading && properties.length === 0 && (
          <Text style={{ color: theme.secondary, textAlign: 'center', marginTop: 8 }}>{t('common.notFound')}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logo: {
    width: '100%',
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  linkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AgencyScreen;
