import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  filterSchools,
  groupSchoolSections,
  type SchoolDirectoryEntry,
} from "@/lib/school-directory";

interface SchoolPickerProps {
  schools: SchoolDirectoryEntry[];
  selectedId: string;
  onSelect: (schoolId: string) => void;
}

export function SchoolPicker({
  schools,
  selectedId,
  onSelect,
}: SchoolPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const selected = schools.find((school) => school.id === selectedId);
  const filtered = useMemo(
    () => filterSchools(schools, query),
    [query, schools],
  );
  const sections = useMemo(() => groupSchoolSections(filtered), [filtered]);

  function chooseSchool(schoolId: string) {
    onSelect(schoolId);
    setVisible(false);
    setQuery("");
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selected ? `Selected school: ${selected.name}` : "Choose your school"
        }
        accessibilityHint="Opens a searchable school directory"
        onPress={() => setVisible(true)}
        className={`min-h-14 justify-center rounded-2xl border bg-white px-4 ${
          selected ? "border-brand-700" : "border-slate-200"
        }`}
      >
        <Text className={selected ? "font-bold text-slate-950" : "text-slate-500"}>
          {selected?.name ?? "Search and select your school"}
        </Text>
        {selected ? (
          <Text className="mt-1 text-sm text-slate-500">
            {[selected.code, selected.block_name].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </Pressable>

      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <View className="min-w-0 flex-1 pr-4">
              <Text className="text-xl font-black text-slate-950">Choose your school</Text>
              <Text className="mt-1 text-sm text-slate-500">
                {filtered.length} of {schools.length} schools
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close school directory"
              onPress={() => setVisible(false)}
              className="rounded-xl bg-slate-100 px-4 py-2"
            >
              <Text className="font-bold text-slate-700">Close</Text>
            </Pressable>
          </View>

          <View className="bg-white px-5 pb-4">
            <TextInput
              accessibilityLabel="Search schools"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, UDISE code, block, or city"
              placeholderTextColor="#94A3B8"
              className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-950"
            />
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={9}
            stickySectionHeadersEnabled
            contentContainerStyle={{ paddingBottom: 32 }}
            renderSectionHeader={({ section }) => (
              <View className="border-y border-slate-200 bg-slate-100 px-5 py-2.5">
                <Text className="text-xs font-black uppercase tracking-wider text-brand-800">
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => chooseSchool(item.id)}
                  className={`border-b px-5 py-4 ${
                    isSelected
                      ? "border-brand-200 bg-brand-50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <Text className="font-bold text-slate-950">{item.name}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {[item.code, item.city, item.state].filter(Boolean).join(" · ")}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="px-6 py-16">
                <Text className="text-center text-lg font-bold text-slate-900">
                  No matching schools
                </Text>
                <Text className="mt-2 text-center leading-6 text-slate-500">
                  Try the school name, UDISE code, block, or city.
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
